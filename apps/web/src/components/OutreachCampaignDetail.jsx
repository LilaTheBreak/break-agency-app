import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Check, AlertCircle, MessageSquare, Calendar, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

/**
 * OutreachCampaignDetail
 * 
 * Full campaign view with:
 * - Draft history and content
 * - Reply tracking with sentiment
 * - Timeline of events
 * - Booking CTA if positive reply received
 */

export default function OutreachCampaignDetail({ campaignId, onBack, onApprovalRequest, refreshTrigger = 0 }) {
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState(null);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetail();
    }
  }, [campaignId, refreshTrigger]);

  const fetchCampaignDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/assisted-outreach/campaigns/${campaignId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaign details');
      }

      const data = await response.json();
      setCampaignData(data.campaign);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    setBooking(true);
    setBookingError(null);
    try {
      const response = await fetch(`/api/assisted-outreach/campaigns/${campaignId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book meeting');
      }

      const data = await response.json();
      setCampaignData(data.campaign);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const statusConfig = {
    DRAFT_REQUIRES_APPROVAL: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800', icon: '📝' },
    SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: '✉️' },
    REPLIED: { label: 'Replied', color: 'bg-green-100 text-green-800', icon: '💬' },
  };

  const sentimentConfig = {
    POSITIVE: { label: 'Positive', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-100' },
    NEUTRAL: { label: 'Neutral', icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-100' },
    NEGATIVE: { label: 'Negative', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-100' },
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const goalDisplay = (goal) => {
    const mapping = {
      STRATEGY_AUDIT: 'Strategy Audit',
      CREATIVE_CONCEPTS: 'Creative Concepts',
      CREATOR_MATCHING: 'Creator Matching'
    };
    return mapping[goal] || goal;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading campaign details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Campaign not found</p>
      </div>
    );
  }

  const approvedDraft = campaignData.drafts?.find(d => d.isApprovedVersion);
  const positiveReplies = campaignData.replies?.filter(r => r.sentiment === 'POSITIVE') || [];
  const hasPosReply = positiveReplies.length > 0;

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Campaigns
      </button>

      {/* Header */}
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{campaignData.brand?.name}</h2>
            <p className="text-gray-600">
              {campaignData.contact?.firstName} {campaignData.contact?.lastName} • {campaignData.contact?.title}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusConfig[campaignData.status]?.color || ''}`}>
            {statusConfig[campaignData.status]?.icon} {statusConfig[campaignData.status]?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-mono text-sm text-gray-900">{campaignData.contact?.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Goal</p>
            <p className="font-semibold text-gray-900">{goalDisplay(campaignData.goal)}</p>
          </div>
          <div>
            <p className="text-gray-600">Created</p>
            <p className="text-gray-900">{formatDate(campaignData.createdAt)}</p>
          </div>
          {campaignData.sentAt && (
            <div>
              <p className="text-gray-600">Sent</p>
              <p className="text-gray-900">{formatDate(campaignData.sentAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA for Positive Reply */}
      {hasPosReply && campaignData.status !== 'BOOKED' && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Positive Response Received!</p>
              <p className="text-sm text-green-800 mt-1">
                This contact has responded positively. Book a meeting to continue the conversation.
              </p>
              {bookingError && (
                <p className="text-sm text-red-700 mt-2">Error: {bookingError}</p>
              )}
              <button
                onClick={handleBook}
                disabled={booking}
                className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                {booking ? 'Booking...' : '📅 Book Strategy Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booked Status */}
      {campaignData.status === 'BOOKED' && (
        <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg flex items-start gap-3">
          <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-purple-900">✓ Meeting Booked</p>
            <p className="text-sm text-purple-800 mt-1">
              This opportunity has been converted to a booked meeting as of {formatDate(campaignData.bookedAt)}.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Drafts */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Drafts
          </h3>

          {campaignData.drafts && campaignData.drafts.length > 0 ? (
            <div className="space-y-4">
              {campaignData.drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`p-4 rounded-lg border-2 ${
                    draft.isApprovedVersion
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">Version {draft.version}</h4>
                      {draft.isApprovedVersion && (
                        <span className="text-xs font-semibold text-green-700">✓ Approved & Sent</span>
                      )}
                      {draft.wasEdited && (
                        <span className="text-xs font-semibold text-blue-700 ml-2">(Edited)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {draft.sentAt && <p>Sent: {formatDate(draft.sentAt)}</p>}
                      {draft.approvedAt && !draft.sentAt && <p>Approved: {formatDate(draft.approvedAt)}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700">Subject:</p>
                      <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded text-xs">{draft.subject}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Message:</p>
                      <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded text-xs whitespace-pre-wrap break-words leading-relaxed">
                        {draft.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-600">
              <p>No drafts available</p>
            </div>
          )}
        </div>

        {/* Right Column: Replies & Timeline */}
        <div className="lg:col-span-1 space-y-6">
          {/* Replies */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Replies ({campaignData.replies?.length || 0})
            </h3>

            {campaignData.replies && campaignData.replies.length > 0 ? (
              <div className="space-y-3">
                {campaignData.replies.map((reply) => {
                  const sentConfig = sentimentConfig[reply.sentiment] || sentimentConfig.NEUTRAL;
                  const SentimentIcon = sentConfig.icon;

                  return (
                    <div key={reply.id} className={`p-3 rounded-lg border ${sentConfig.bg}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <SentimentIcon className={`w-4 h-4 ${sentConfig.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{sentConfig.label}</p>
                          <p className="text-xs text-gray-600">{formatDate(reply.detectedAt)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-3">{reply.replyText}</p>
                      <p className="text-xs text-gray-600 mt-2">From: {reply.senderEmail}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-600">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No replies yet</p>
              </div>
            )}
          </div>

          {/* Campaign Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">Campaign Info</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Sender</p>
                <p>{campaignData.senderUser?.name}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Created by</p>
                <p>{campaignData.createdByUser?.name}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Campaign ID</p>
                <p className="font-mono text-xs text-gray-600 break-all">{campaignData.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
