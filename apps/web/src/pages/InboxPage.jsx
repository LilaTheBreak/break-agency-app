import React, { useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getGmailAuthUrl, listGmailMessages, getDealDrafts } from "../services/gmailClient.js";
import { getGmailStatus, syncGmailInbox } from "../services/inboxClient.js";
import { FeatureGate, useFeature, DisabledNotice } from "../components/FeatureGate.jsx";
import { INBOX_SCANNING_ENABLED } from "../config/features.js";
import toast from "react-hot-toast";

function InboxDisconnected() {
  // UNLOCK WHEN: INBOX_SCANNING_ENABLED flag + Gmail OAuth configured + /api/gmail/* endpoints functional
  const isInboxEnabled = useFeature(INBOX_SCANNING_ENABLED);
  
  const handleConnect = async () => {
    if (!isInboxEnabled) return; // Gate action
    try {
      const { url } = await getGmailAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to start Gmail connection:", error);
      alert("Could not connect to Gmail. Please try again later.");
    }
  };

  return (
    <div className="text-center rounded-3xl border border-brand-black/10 bg-brand-white p-8">
      <h3 className="font-display text-2xl uppercase">Connect Your Inbox</h3>
      <p className="mt-2 text-sm text-brand-black/70">
        Link your Gmail account to allow Break's AI to scan for opportunities, draft replies, and manage your deal flow automatically.
      </p>
      {!isInboxEnabled && <DisabledNotice feature={INBOX_SCANNING_ENABLED} />}
      <FeatureGate feature={INBOX_SCANNING_ENABLED} mode="button">
        <button
          onClick={handleConnect}
          className="mt-6 rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
        >
          Connect Gmail Account
        </button>
      </FeatureGate>
    </div>
  );
}

function InboxConnected({ user }) {
  const [messages, setMessages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [messagesData, dealsData] = await Promise.all([
        listGmailMessages(),
        getDealDrafts(user.id),
      ]);
      setMessages(messagesData.messages || []);
      setDeals(dealsData.drafts || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load inbox data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await syncGmailInbox();
      toast.success('Gmail sync completed');
      await fetchData(); // Reload messages after sync
    } catch (err) {
      setError(err.message || "Failed to sync Gmail");
      toast.error('Gmail sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl uppercase">Recent Messages</h3>
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </button>
        </div>
        {loading && <p>Loading messages...</p>}
        {error && <p className="text-brand-red">{error}</p>}
        {!loading && messages.map(msg => (
          <div key={msg.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <p className="font-semibold text-sm">{msg.subject}</p>
            <p className="text-xs text-brand-black/60">From: {msg.from}</p>
            <p className="text-xs text-brand-black/70 truncate mt-1">{msg.snippet}</p>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <h3 className="font-display text-2xl uppercase">AI Deal Drafts</h3>
        {loading && <p>Loading deals...</p>}
        {!loading && deals.map(deal => (
          <div key={deal.id} className="rounded-2xl border border-brand-red/20 bg-brand-linen/50 p-4">
            <p className="font-semibold text-sm">{deal.brandName}</p>
            <p className="text-xs text-brand-red">Potential Value: £{deal.predictedValueExpected}</p>
            <p className="text-xs text-brand-black/70 mt-1">{deal.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InboxPage() {
  const { user } = useAuth();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Check Gmail connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await getGmailStatus();
        setGmailConnected(status.connected);
      } catch (error) {
        console.error("[INBOX] Failed to check Gmail status:", error);
        setGmailConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };
    checkConnection();
  }, []);

  // Also check for gmail_connected=1 query param (after OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_connected') === '1') {
      setGmailConnected(true);
      toast.success('Gmail connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('gmail_error')) {
      const errorType = params.get('gmail_error');
      let errorMessage = 'Failed to connect Gmail. Please try again.';
      
      switch(errorType) {
        case 'redirect_uri_mismatch':
          errorMessage = 'Gmail OAuth configuration error. Please contact support.';
          break;
        case 'code_expired':
          errorMessage = 'Authorization code expired. Please try connecting again.';
          break;
        case 'invalid_credentials':
          errorMessage = 'Gmail OAuth credentials invalid. Please contact support.';
          break;
        case 'missing_refresh_token':
          errorMessage = 'Gmail did not provide refresh token. Please try again.';
          break;
        default:
          errorMessage = 'Failed to connect Gmail. Please try again.';
      }
      
      toast.error(errorMessage);
      console.error('[INBOX] Gmail connection error:', errorType);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (checkingConnection) {
    return (
      <DashboardShell
        title="Priority Inbox"
        subtitle="AI-powered email scanning, deal extraction, and automated replies."
      >
        <div className="text-center p-8">
          <p className="text-sm text-brand-black/60">Checking Gmail connection...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Priority Inbox"
      subtitle="AI-powered email scanning, deal extraction, and automated replies."
    >
      {gmailConnected ? <InboxConnected user={user} /> : <InboxDisconnected />}
    </DashboardShell>
  );
}