import React, { useState } from 'react';
import { useGrowthInitiatives } from '../../hooks/useGrowthInitiatives.js';
import { InitiativeCard, InitiativeForm } from '../GrowthInitiatives/GrowthInitiativeComponents.jsx';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * TalentGrowthInitiativesDashboard
 * 
 * Displays all growth initiatives for a talent in the Admin Talent Detail page.
 * Uses the existing useGrowthInitiatives hook and GrowthInitiativeComponents.
 * 
 * For Agents (full access):
 * - View all initiatives
 * - Create new initiatives
 * - Edit existing initiatives
 * - Delete initiatives
 * 
 * For Talent (read-only):
 * - View initiatives only
 */
export function TalentGrowthInitiativesDashboard({ talentId }) {
  const {
    initiatives,
    loading,
    error,
    createInitiative,
    updateInitiative,
    deleteInitiative,
  } = useGrowthInitiatives(talentId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    try {
      await createInitiative({
        ...formData,
        talentId,
      });
      toast.success('Initiative created');
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create initiative');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (initiativeId, formData) => {
    setIsSubmitting(true);
    try {
      await updateInitiative(initiativeId, formData);
      toast.success('Initiative updated');
      setEditingId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update initiative');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (initiativeId) => {
    if (!window.confirm('Delete this initiative? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteInitiative(initiativeId);
      toast.success('Initiative deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete initiative');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-brand-black/60">Loading initiatives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-black">
            Growth Initiatives
          </h3>
          <p className="text-sm text-brand-black/60 mt-1">
            Strategic bets and investments for this talent
          </p>
        </div>
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red/90 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Initiative
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showForm || editingId) && (
        <div className="rounded-lg border border-brand-black/10 bg-brand-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-brand-black">
              {editingId ? 'Edit Initiative' : 'Create Initiative'}
            </h4>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-sm text-brand-black/60 hover:text-brand-black"
            >
              Cancel
            </button>
          </div>
          <InitiativeForm
            initiative={editingId ? initiatives.find(i => i.id === editingId) : null}
            onSubmit={editingId ? (data) => handleUpdate(editingId, data) : handleCreate}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Initiatives Grid */}
      {initiatives.length === 0 ? (
        <div className="rounded-lg border border-brand-black/10 bg-brand-white/50 p-12 text-center">
          <p className="text-brand-black/60 mb-4">
            No growth initiatives yet
          </p>
          <p className="text-sm text-brand-black/50 mb-6">
            Start tracking strategic bets for this talent
          </p>
          {!showForm && !editingId && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red/90 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Initiative
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initiatives.map((initiative) => (
            <InitiativeCard
              key={initiative.id}
              initiative={initiative}
              onEdit={() => setEditingId(initiative.id)}
              onDelete={() => handleDelete(initiative.id)}
              onViewDetails={() => {
                // Could implement a detail view modal here
                console.log('View details:', initiative);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
