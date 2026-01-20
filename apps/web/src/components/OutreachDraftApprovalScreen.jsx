import React, { useState, useEffect } from 'react';
import { AlertCircle, Send, Copy, Loader2 } from 'lucide-react';

/**
 * OutreachDraftApprovalScreen
 * 
 * 3-column layout for reviewing, editing, and approving outreach email drafts
 * Shows Version A (Strategic), B (Creative), and C (Founder)
 * User can edit any draft before choosing one to send
 */

export default function OutreachDraftApprovalScreen({ campaign, drafts, onApproveAndSend, isLoading }) {
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [selectedVersions, setSelectedVersions] = useState({}); // Track which drafts were edited
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Version labels
  const versionLabels = {
    A: { name: 'Strategic', color: 'bg-blue-50', borderColor: 'border-blue-200', labelColor: 'bg-blue-100' },
    B: { name: 'Creative', color: 'bg-green-50', borderColor: 'border-green-200', labelColor: 'bg-green-100' },
    C: { name: 'Founder', color: 'bg-purple-50', borderColor: 'border-purple-200', labelColor: 'bg-purple-100' },
  };

  const handleEditStart = (draft) => {
    setEditingDraftId(draft.id);
    setEditedData({
      ...editedData,
      [draft.id]: {
        subject: draft.subject,
        body: draft.body
      }
    });
  };

  const handleEditChange = (draftId, field, value) => {
    setEditedData({
      ...editedData,
      [draftId]: {
        ...(editedData[draftId] || {}),
        [field]: value
      }
    });
  };

  const handleSaveDraft = async (draft) => {
    const edits = editedData[draft.id];
    if (!edits) return;

    try {
      setError(null);
      const response = await fetch(`/api/assisted-outreach/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: edits.subject,
          body: edits.body
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      setEditingDraftId(null);
      setSelectedVersions({
        ...selectedVersions,
        [draft.id]: true // Mark as edited/selected
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApproveAndSend = async (draft) => {
    if (!draft || draft.sentAt) return;

    try {
      setSending(true);
      setError(null);

      const response = await fetch(`/api/assisted-outreach/drafts/${draft.id}/approve-and-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      onApproveAndSend && onApproveAndSend(draft);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const sortedDrafts = [...(drafts || [])].sort((a, b) => a.version.localeCompare(b.version));

  return (
    <div className="w-full">
      {/* Header Context */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Brand</p>
            <p className="font-semibold text-gray-900">{campaign?.brand?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Contact</p>
            <p className="font-semibold text-gray-900">{campaign?.contact?.firstName} {campaign?.contact?.lastName}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-mono text-sm text-gray-700">{campaign?.contact?.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Goal</p>
            <p className="font-semibold text-gray-900">{campaign?.goal?.replace(/_/g, ' ') || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 3-Column Draft Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedDrafts.map((draft) => {
          const version = draft.version;
          const label = versionLabels[version];
          const isEditing = editingDraftId === draft.id;
          const isSent = draft.sentAt;
          const isEdited = selectedVersions[draft.id] || draft.wasEdited;

          return (
            <div
              key={draft.id}
              className={`rounded-lg border-2 overflow-hidden transition-all ${label.borderColor} ${label.color}`}
            >
              {/* Draft Header */}
              <div className={`px-4 py-3 ${label.labelColor} border-b-2 ${label.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">Version {version}</h3>
                    <p className="text-sm text-gray-700">{label.name}</p>
                  </div>
                  {isSent && (
                    <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
                      SENT
                    </span>
                  )}
                  {isEdited && !isSent && (
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded">
                      EDITED
                    </span>
                  )}
                </div>
              </div>

              {/* Draft Content */}
              <div className="p-4 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData[draft.id]?.subject || draft.subject}
                      onChange={(e) => handleEditChange(draft.id, 'subject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                      placeholder="Email subject"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 font-mono">
                      {draft.subject}
                    </p>
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Message Body</label>
                  {isEditing ? (
                    <textarea
                      value={editedData[draft.id]?.body || draft.body}
                      onChange={(e) => handleEditChange(draft.id, 'body', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                      rows="8"
                      placeholder="Email body"
                    />
                  ) : (
                    <pre className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 font-mono whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {draft.body}
                    </pre>
                  )}
                </div>

                {/* Word Count */}
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>Subject: {draft.subject?.length || 0} chars</span>
                  <span>Body: {draft.body?.split(' ').length || 0} words</span>
                </div>
              </div>

              {/* Draft Actions */}
              <div className="px-4 py-3 bg-gray-100 border-t border-gray-300 space-y-2">
                {!isSent ? (
                  <>
                    {isEditing ? (
                      <button
                        onClick={() => handleSaveDraft(draft)}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Save Changes
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditStart(draft)}
                        className="w-full px-3 py-2 bg-gray-400 hover:bg-gray-500 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => handleApproveAndSend(draft)}
                      disabled={sending || isSent}
                      className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Approve & Send
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyToClipboard(draft.body, 'message')}
                      className="w-full px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 text-sm font-semibold rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Message
                    </button>
                  </>
                ) : (
                  <div className="w-full px-3 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded text-center">
                    ✓ Sent to {campaign?.contact?.email}
                  </div>
                )}
              </div>

              {/* Edit State Indicator */}
              {isEditing && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Editing mode - click Save Changes to confirm edits
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedDrafts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No drafts available for this campaign.</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>How to use:</strong> Review all three versions above. You can edit any version before sending. 
          Once you click "Approve & Send", the email will be sent to {campaign?.contact?.email || 'the contact'} 
          and we'll track replies for follow-up opportunities.
        </p>
      </div>
    </div>
  );
}
