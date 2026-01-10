import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Settings, Plus, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../services/apiClient.js';

/**
 * TalentSettingsPanel
 * 
 * Displays and manages talent settings including:
 * - Currency selection (GBP, USD, EUR, AED, etc.)
 * - Manager assignments (PRIMARY/SECONDARY roles)
 * - Manager multi-select
 * 
 * Props:
 * - talentId: Talent ID to manage settings for
 * - talentName: Talent name for display
 * - onSettingsChanged: Callback when settings are updated
 */
export function TalentSettingsPanel({ talentId, talentName, onSettingsChanged }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Settings state
  const [currency, setCurrency] = useState('GBP');
  const [managers, setManagers] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [selectedManagerRole, setSelectedManagerRole] = useState('SECONDARY');

  // Load settings when panel expands
  useEffect(() => {
    if (isExpanded && !isLoading) {
      loadSettings();
    }
  }, [isExpanded]);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [settingsRes, managersRes] = await Promise.all([
        apiFetch(`/api/admin/talent/${talentId}/settings`),
        apiFetch(`/api/admin/talent/${talentId}/settings/available-managers`),
      ]);

      if (!settingsRes.ok || !managersRes.ok) {
        throw new Error('Failed to load settings');
      }

      const settingsData = await settingsRes.json();
      const managersData = await managersRes.json();

      setCurrency(settingsData.currency || 'GBP');
      setManagers(settingsData.managers || []);
      setAvailableManagers(managersData.managers || []);
    } catch (err) {
      console.error('[TALENT_SETTINGS] Error loading settings:', err);
      setError(err.message);
      toast.error('Failed to load talent settings');
    } finally {
      setIsLoading(false);
    }
  }, [talentId]);

  const handleAddManager = async () => {
    if (!selectedManagerId) {
      toast.error('Please select a manager');
      return;
    }

    // Check if already assigned
    if (managers.some((m) => m.managerId === selectedManagerId)) {
      toast.error('This manager is already assigned');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        currency,
        managers: [
          ...managers,
          {
            managerId: selectedManagerId,
            role: selectedManagerRole,
          },
        ],
      };

      const res = await apiFetch(`/api/admin/talent/${talentId}/settings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update managers');
      }

      const data = await res.json();
      setManagers(data.managers || []);
      setSelectedManagerId('');
      setSelectedManagerRole('SECONDARY');

      toast.success('Manager assigned successfully');
      onSettingsChanged?.();
    } catch (err) {
      console.error('[TALENT_SETTINGS] Error adding manager:', err);
      toast.error(err.message || 'Failed to assign manager');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveManager = async (managerId) => {
    try {
      setIsSaving(true);

      const payload = {
        currency,
        managers: managers.filter((m) => m.managerId !== managerId),
      };

      const res = await apiFetch(`/api/admin/talent/${talentId}/settings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to remove manager');
      }

      const data = await res.json();
      setManagers(data.managers || []);

      toast.success('Manager removed successfully');
      onSettingsChanged?.();
    } catch (err) {
      console.error('[TALENT_SETTINGS] Error removing manager:', err);
      toast.error(err.message || 'Failed to remove manager');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrencyChange = async (newCurrency) => {
    try {
      setIsSaving(true);

      const payload = {
        currency: newCurrency,
        managers: managers.map((m) => ({
          managerId: m.managerId,
          role: m.role,
        })),
      };

      const res = await apiFetch(`/api/admin/talent/${talentId}/settings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update currency');
      }

      const data = await res.json();
      setCurrency(data.currency);

      toast.success(`Currency changed to ${newCurrency}`);
      onSettingsChanged?.();
    } catch (err) {
      console.error('[TALENT_SETTINGS] Error updating currency:', err);
      toast.error(err.message || 'Failed to update currency');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeRole = async (managerId, newRole) => {
    try {
      setIsSaving(true);

      const payload = {
        currency,
        managers: managers.map((m) =>
          m.managerId === managerId ? { managerId, role: newRole } : { managerId: m.managerId, role: m.role }
        ),
      };

      const res = await apiFetch(`/api/admin/talent/${talentId}/settings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update manager role');
      }

      const data = await res.json();
      setManagers(data.managers || []);

      toast.success('Manager role updated');
      onSettingsChanged?.();
    } catch (err) {
      console.error('[TALENT_SETTINGS] Error updating role:', err);
      toast.error(err.message || 'Failed to update manager role');
    } finally {
      setIsSaving(false);
    }
  };

  const currencyOptions = ['GBP', 'USD', 'EUR', 'AED', 'CAD', 'AUD', 'JPY'];
  const currencySymbols = { GBP: '£', USD: '$', EUR: '€', AED: 'د.إ', CAD: 'C$', AUD: 'A$', JPY: '¥' };

  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-white">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-brand-linen/30 transition-colors"
        disabled={isLoading}
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-brand-red" />
          <div className="text-left">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-black">
              Talent Settings
            </h3>
            <p className="text-xs text-brand-black/50 mt-1">
              Currency • Manager assignments
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-brand-black/50 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-brand-black/10 p-6 space-y-6">
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Currency Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-3">
              Currency
            </label>
            <div className="flex flex-wrap gap-2">
              {currencyOptions.map((code) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code)}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    currency === code
                      ? 'bg-brand-red text-white'
                      : 'bg-brand-black/5 text-brand-black hover:bg-brand-black/10'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {currencySymbols[code]} {code}
                </button>
              ))}
            </div>
            <p className="text-xs text-brand-black/50 mt-2">
              All deals and payments for this talent will use {currencySymbols[currency]} {currency}
            </p>
          </div>

          {/* Manager Assignment Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-black mb-3">
              Assigned Managers
            </label>

            {/* Current Managers */}
            {managers.length > 0 ? (
              <div className="space-y-2 mb-4">
                {managers.map((assignment) => (
                  <div
                    key={assignment.managerId}
                    className="flex items-center justify-between p-3 bg-brand-linen/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {assignment.manager.avatarUrl ? (
                        <img
                          src={assignment.manager.avatarUrl}
                          alt={assignment.manager.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-black/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-brand-black/50">
                            {assignment.manager.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-brand-black">
                          {assignment.manager.name}
                        </p>
                        <p className="text-xs text-brand-black/50">{assignment.manager.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Role selector */}
                      <select
                        value={assignment.role}
                        onChange={(e) => handleChangeRole(assignment.managerId, e.target.value)}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs rounded border border-brand-black/10 bg-white focus:outline-none focus:border-brand-red"
                      >
                        <option value="PRIMARY">Primary</option>
                        <option value="SECONDARY">Secondary</option>
                      </select>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveManager(assignment.managerId)}
                        disabled={isSaving}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-50"
                        title="Remove manager"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-brand-black/5 rounded-lg mb-4">
                <p className="text-xs text-brand-black/50">No managers assigned yet</p>
              </div>
            )}

            {/* Add Manager Form */}
            <div className="space-y-3 p-4 bg-brand-linen/30 rounded-lg border border-brand-black/5">
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-brand-black">
                Add New Manager
              </label>

              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded border border-brand-black/10 bg-white text-sm focus:outline-none focus:border-brand-red"
              >
                <option value="">Select a manager...</option>
                {availableManagers
                  .filter((m) => !managers.some((a) => a.managerId === m.id))
                  .map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
              </select>

              <select
                value={selectedManagerRole}
                onChange={(e) => setSelectedManagerRole(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded border border-brand-black/10 bg-white text-sm focus:outline-none focus:border-brand-red"
              >
                <option value="PRIMARY">Primary Manager</option>
                <option value="SECONDARY">Secondary Manager</option>
              </select>

              <button
                onClick={handleAddManager}
                disabled={isSaving || !selectedManagerId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-red text-white font-semibold rounded-lg hover:bg-brand-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Assign Manager
              </button>
            </div>

            <p className="text-xs text-brand-black/50 mt-3">
              <strong>Primary Manager:</strong> Appears as deal owner and main contact<br />
              <strong>Secondary Manager:</strong> Can collaborate and view analytics
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TalentSettingsPanel;
