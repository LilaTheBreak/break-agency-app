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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to discover contacts');
      }

      const data = await response.json();
      setDiscoveredContacts(data.job?.contacts || []);
      
      // Automatically select all if confidence > 70
      const autoSelected = new Set(
        data.job?.contacts
          ?.filter((c) => c.confidenceScore >= 70)
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve contacts');
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
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        title="Discover contacts from external sources"
      >
        🔍 Discover Contacts
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b">
          <h2 className="text-2xl font-bold">🔍 Discover Brand Contacts</h2>
          <p className="text-blue-100 text-sm mt-1">
            Finding decision-makers and marketing contacts for {brand.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Discovery Section */}
          {discoveredContacts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Click "Discover" to find contacts from public sources
              </p>
              <PrimaryButton
                onClick={handleDiscoverContacts}
                disabled={isLoading}
                className="px-6 py-3"
              >
                {isLoading ? '⏳ Discovering...' : '🔍 Start Discovery'}
              </PrimaryButton>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
              ⚠️ {error}
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
                      className="text-sm px-3 py-1 hover:bg-gray-100 rounded"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-sm px-3 py-1 hover:bg-gray-100 rounded"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Contacts List */}
                <div className="space-y-2 max-h-96 overflow-y-auto border rounded">
                  {discoveredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-3"
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
                        <p className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {contact.jobTitle} at {contact.company}
                        </p>
                        {contact.linkedInUrl && (
                          <a
                            href={contact.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
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
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm font-medium text-blue-900">
                  ✓ {selectedContactIds.size} of {discoveredContacts.length} contacts selected
                </p>
              </div>

              {/* Compliance Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded p-4 space-y-3">
                <p className="text-sm font-medium text-amber-900">⚠️ Compliance Notice</p>
                <p className="text-xs text-amber-800">
                  Contact data is inferred from public sources. You must:
                </p>
                <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
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
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs text-amber-900">
                    I understand and accept these compliance requirements
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
          <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
          {discoveredContacts.length > 0 && (
            <PrimaryButton
              onClick={handleApproveContacts}
              disabled={selectedContactIds.size === 0 || !complianceChecked}
            >
              ✓ Approve {selectedContactIds.size > 0 ? selectedContactIds.size : 'Selected'} Contacts
            </PrimaryButton>
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
