import React, { useState, useEffect } from "react";
import { linkUserToTalent, getTalentEmails, addEmailToTalent } from "../services/talentLinkingClient.js";
import { apiFetch } from "../services/apiClient.js";

export function LinkUserToTalentModal({ isOpen, user, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [talents, setTalents] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [talentEmails, setTalentEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLabel, setEmailLabel] = useState("");
  const [linkingTalent, setLinkingTalent] = useState(false);

  if (!isOpen || !user) return null;

  const handleSearchTalents = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setTalents([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiFetch(`/api/admin/talents/search?q=${encodeURIComponent(query)}`, {
        method: "GET"
      });

      if (!response.ok) {
        throw new Error("Failed to search talents");
      }

      const data = await response.json();
      setTalents(data.talents || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search talents");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTalent = async (talent) => {
    setSelectedTalent(talent);
    setLoading(true);
    try {
      const response = await getTalentEmails(talent.id);
      const data = await response.json();
      setTalentEmails(data.emails || []);
    } catch (err) {
      console.error("Error fetching talent emails:", err);
      setTalentEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkUser = async () => {
    if (!selectedTalent) {
      setError("Please select a talent");
      return;
    }

    setLinkingTalent(true);
    setError(null);
    try {
      const response = await linkUserToTalent(user.id, selectedTalent.id);
      
      if (!response.ok) {
        throw new Error("Failed to link user to talent");
      }

      const data = await response.json();
      setSuccess(`User ${user.email} linked to talent ${selectedTalent.name} successfully!`);
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Link error:", err);
      setError(err.message || "Failed to link user to talent");
    } finally {
      setLinkingTalent(false);
    }
  };

  const handleAddEmail = async () => {
    if (!selectedTalent || !newEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    try {
      const response = await addEmailToTalent(selectedTalent.id, newEmail, emailLabel || null);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add email");
      }

      const data = await response.json();
      setTalentEmails([...talentEmails, data.talentEmail]);
      setNewEmail("");
      setEmailLabel("");
      setShowAddEmail(false);
      setSuccess("Email added successfully!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Add email error:", err);
      setError(err.message || "Failed to add email");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Link User to Talent</h2>
            <p className="text-sm text-gray-600 mt-1">User: {user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
              {success}
            </div>
          )}

          {/* Search Talents */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Search and Select Talent
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchTalents(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={selectedTalent !== null}
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin h-5 w-5 text-blue-500">
                    <svg
                      className="w-full h-full"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 4a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4z"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Talents List */}
            {!selectedTalent && talents.length > 0 && (
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {talents.map((talent) => (
                  <button
                    key={talent.id}
                    onClick={() => handleSelectTalent(talent)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{talent.name}</div>
                    <div className="text-sm text-gray-600">{talent.primaryEmail || "No email"}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Talent */}
            {selectedTalent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-blue-900">{selectedTalent.name}</div>
                    <div className="text-sm text-blue-700 mt-1">{selectedTalent.primaryEmail}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTalent(null);
                      setSearchQuery("");
                      setTalentEmails([]);
                      setError(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Talent Emails */}
          {selectedTalent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Linked Emails ({talentEmails.length})
                </label>
                <button
                  onClick={() => setShowAddEmail(!showAddEmail)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Email
                </button>
              </div>

              {/* Add Email Form */}
              {showAddEmail && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={emailLabel}
                    onChange={(e) => setEmailLabel(e.target.value)}
                    placeholder="Label (optional, e.g., 'Manager', 'Assistant')"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddEmail}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Add Email
                    </button>
                    <button
                      onClick={() => {
                        setShowAddEmail(false);
                        setNewEmail("");
                        setEmailLabel("");
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Emails List */}
              {talentEmails.length > 0 ? (
                <div className="space-y-2">
                  {talentEmails.map((email) => (
                    <div
                      key={email.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{email.email}</div>
                        {email.label && (
                          <div className="text-xs text-gray-600">{email.label}</div>
                        )}
                        {email.isPrimary && (
                          <div className="text-xs font-medium text-blue-600">Primary</div>
                        )}
                      </div>
                      {email.verified && (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No emails linked yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLinkUser}
            disabled={!selectedTalent || linkingTalent}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {linkingTalent ? "Linking..." : "Link User to Talent"}
          </button>
        </div>
      </div>
    </div>
  );
}
