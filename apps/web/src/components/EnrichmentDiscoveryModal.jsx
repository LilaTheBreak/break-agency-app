import React, { useState, useEffect } from 'react';
import Button, { PrimaryButton, SecondaryButton } from './Button.jsx';

/**
 * Enrichment Discovery Modal
 * 
 * UI for discovering contacts from external sources
 * Shows:
 * - Loading state while discovering
 * - Results table with confidence badges
 * - Approval workflow
 * - Compliance disclaimers
 */

export function EnrichmentDiscoveryModal({ brand, onClose, onApprove }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [discoveredContacts, setDiscoveredContacts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedContactIds, setSelectedContactIds] = useState(new Set());
  const [complianceChecked, setComplianceChecked] = useState(false);

  // Open modal
  const openModal = () => {
    setIsOpen(true);
    setDiscoveredContacts([]);
    setError(null);
    setSelectedContactIds(new Set());
    setComplianceChecked(false);
  };

  // Close modal
  const closeModal = () => {
    setIsOpen(false);
  };

  // Discover contacts
  const handleDiscoverContacts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enrichment/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: brand.id,
          brandName: brand.name,
          website: brand.website,
          linkedInCompanyUrl: brand.linkedInUrl,
          region: 'US', // TODO: Get from user settings
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to discover contacts';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: expected JSON');
      }
      
      const data = await response.json();
      const contacts = Array.isArray(data.job?.contacts) ? data.job.contacts : [];
      setDiscoveredContacts(contacts);
      
      // Automatically select all if confidence > 70
      const autoSelected = new Set(
        contacts
          .filter((c) => c && c.confidenceScore >= 70)
          .map((c) => c.id) || []
      );
      setSelectedContactIds(autoSelected);
    } catch (err) {
      setError(err.message);
      console.error('[ENRICHMENT UI] Discovery error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle contact selection
  const toggleContactSelection = (contactId) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    setSelectedContactIds(new Set(discoveredContacts.map((c) => c.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedContactIds(new Set());
  };

  // Approve selected contacts
  const handleApproveContacts = async () => {
    if (selectedContactIds.size === 0) {
      setError('Please select at least one contact');
      return;
    }

    if (!complianceChecked) {
      setError('Please confirm compliance statement');
      return;
    }

    try {
      const response = await fetch('/api/enrichment/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactIds: Array.from(selectedContactIds),
          brandId: brand.id,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to approve contacts';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: expected JSON');
      }
      
      const data = await response.json();
      
      // Callback to parent
      if (onApprove) {
        onApprove(data);
      }

      // Close modal
      closeModal();
    } catch (err) {
      setError(err.message);
      console.error('[ENRICHMENT UI] Approval error:', err);
    }
  };

  // Get confidence color
  const getConfidenceColor = (score) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  if (!isOpen) {
    return (
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] hover:bg-brand-red/90 transition"
        title="Discover contacts from external sources"
      >
        🔍 Discover Contacts
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 backdrop-blur-sm">
      <div className="bg-brand-white rounded-3xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-brand-red text-white p-6 border-b border-brand-black/10">
          <h2 className="font-title text-2xl font-bold uppercase tracking-[0.2em]">🔍 Discover Brand Contacts</h2>
          <p className="text-brand-red/90 text-xs mt-2 tracking-[0.1em]">
            Finding decision-makers and marketing contacts for {brand.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Discovery Section */}
          {discoveredContacts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-brand-black/70 mb-4 text-sm">
                Click "Discover" to find contacts from public sources
              </p>
              <button
                onClick={handleDiscoverContacts}
                disabled={isLoading}
                className="px-6 py-3 bg-brand-red text-white font-semibold text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-red/90 disabled:opacity-50 transition"
              >
                {isLoading ? '⏳ Discovering...' : '🔍 Start Discovery'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700">
              <p className="text-sm font-semibold">⚠️ {error}</p>
            </div>
          )}

          {/* Results Table */}
          {discoveredContacts.length > 0 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Found {discoveredContacts.length} Contacts
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs px-3 py-1 hover:bg-brand-black/5 rounded-lg font-semibold text-brand-black/80 transition"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-xs px-3 py-1 hover:bg-brand-black/5 rounded-lg font-semibold text-brand-black/80 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Contacts List */}
                <div className="space-y-2 max-h-96 overflow-y-auto border border-brand-black/10 rounded-2xl">
                  {discoveredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 hover:bg-brand-black/2 border-b border-brand-black/10 last:border-b-0 flex items-start gap-3 transition"
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="mt-1 w-4 h-4 rounded"
                      />

                      {/* Contact Info */}
                      <div className="flex-1">
                        <p className="font-semibold text-brand-black">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-xs text-brand-black/70 mt-0.5">
                          {contact.jobTitle} at {contact.company}
                        </p>
                        {contact.linkedInUrl && (
                          <a
                            href={contact.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-red hover:text-brand-red/80 font-semibold mt-1 inline-block"
                          >
                            LinkedIn Profile →
                          </a>
                        )}
                      </div>

                      {/* Confidence Badge */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getConfidenceColor(contact.confidenceScore) }}
                        >
                          {contact.confidenceScore}
                        </div>
                        <span className="text-xs text-gray-500">confidence</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Summary */}
              <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-4">
                <p className="text-sm font-semibold text-brand-red">
                  ✓ {selectedContactIds.size} of {discoveredContacts.length} contacts selected
                </p>
              </div>

              {/* Compliance Disclaimer */}
              <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-brand-red">⚠️ Compliance Notice</p>
                <p className="text-xs text-brand-black/70">
                  Contact data is inferred from public sources. You must:
                </p>
                <ul className="text-xs text-brand-black/70 space-y-1 ml-4 list-disc">
                  <li>Verify contact accuracy before outreach</li>
                  <li>Comply with applicable data protection laws (GDPR, CCPA, etc.)</li>
                  <li>Include your company information in outreach messages</li>
                  <li>Provide easy opt-out mechanisms</li>
                  <li>Honor do-not-contact requests immediately</li>
                </ul>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={complianceChecked}
                    onChange={(e) => setComplianceChecked(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-black/20"
                  />
                  <span className="text-xs text-brand-black/70">
                    I understand and accept these compliance requirements
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-brand-linen/30 border-t border-brand-black/10 p-4 flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/70 hover:text-brand-black hover:bg-brand-black/5 rounded-2xl transition">
            Cancel
          </button>
          {discoveredContacts.length > 0 && (
            <button
              onClick={handleApproveContacts}
              disabled={selectedContactIds.size === 0 || !complianceChecked}
              className="px-4 py-2 bg-brand-red text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ✓ Approve {selectedContactIds.size > 0 ? selectedContactIds.size : 'Selected'} Contacts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to use the enrichment modal
 */
export function useEnrichmentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const openModal = (brand) => {
    setSelectedBrand(brand);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedBrand(null);
  };

  return {
    isOpen,
    selectedBrand,
    openModal,
    closeModal,
  };
}
