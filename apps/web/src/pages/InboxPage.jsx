import React, { useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getGmailAuthUrl, listGmailMessages, getDealDrafts } from "../services/gmailClient.js";

function InboxDisconnected() {
  const handleConnect = async () => {
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
      <button
        onClick={handleConnect}
        className="mt-6 rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
      >
        Connect Gmail Account
      </button>
    </div>
  );
}

function InboxConnected({ user }) {
  const [messages, setMessages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [messagesData, dealsData] = await Promise.all([
          listGmailMessages(),
          getDealDrafts(user.id),
        ]);
        setMessages(messagesData.messages || []);
        setDeals(dealsData.drafts || []);
      } catch (err) {
        setError(err.message || "Failed to load inbox data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-display text-2xl uppercase">Recent Messages</h3>
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

  // We need to check if the user has a linked Google account.
  // Based on the schema, this would be the `googleAccount` relation on the `User` model.
  const isConnected = user && user.googleAccount;

  return (
    <DashboardShell
      title="Priority Inbox"
      subtitle="AI-powered email scanning, deal extraction, and automated replies."
    >
      {isConnected ? <InboxConnected user={user} /> : <InboxDisconnected />}
    </DashboardShell>
  );
}