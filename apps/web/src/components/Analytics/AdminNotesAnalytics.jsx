import React, { useState, useCallback } from "react";
import { FileText, Save, X, Plus } from "lucide-react";
import { apiFetch } from "../../services/apiClient.js";
import { toast } from "react-hot-toast";

/**
 * AdminNotesAnalytics
 * 
 * Persistent notes for admin insights:
 * - Why this creator performs
 * - Brand fit analysis
 * - Negotiation leverage points
 * - Custom observations
 */
export default function AdminNotesAnalytics({ profile, comparisonProfile }) {
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comparisonNotes, setComparisonNotes] = useState("");
  const [editingComparison, setEditingComparison] = useState(false);

  /**
   * Save notes
   */
  const handleSaveNotes = useCallback(async () => {
    if (!profile || profile.type !== "talent") {
      toast.error("Can only save notes for talent profiles");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(`/api/admin/talent/${profile.id}/analytics-notes`, {
        method: "POST",
        body: JSON.stringify({ notes }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setEditing(false);
      toast.success("Notes saved");
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }, [profile, notes]);

  /**
   * Save comparison notes
   */
  const handleSaveComparisonNotes = useCallback(async () => {
    if (!comparisonProfile || comparisonProfile.type !== "talent") {
      toast.error("Can only save notes for talent profiles");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        `/api/admin/talent/${comparisonProfile.id}/comparison-notes`,
        {
          method: "POST",
          body: JSON.stringify({
            notes: comparisonNotes,
            comparedWithId: profile.id,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setEditingComparison(false);
      toast.success("Comparison notes saved");
    } catch (err) {
      console.error("Error saving comparison notes:", err);
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }, [comparisonProfile, profile, comparisonNotes]);

  if (!profile) {
    return null;
  }

  const canSaveNotes = profile.type === "talent";

  return (
    <>
      {/* Primary Profile Notes */}
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-brand-red" />
            <div>
              <h3 className="font-display text-2xl uppercase text-brand-black">Admin Notes</h3>
              <p className="text-xs text-brand-black/60 mt-1">
                Insights about {profile.name}
              </p>
            </div>
          </div>

          {canSaveNotes && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-full border border-brand-black/20 px-3 py-2 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-brand-black/5 transition"
            >
              <Plus className="h-3 w-3" />
              {notes ? "Edit" : "Add"}
            </button>
          )}
        </div>

        {!editing ? (
          // Display mode
          <div className="space-y-4">
            {notes ? (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
                <p className="text-sm text-brand-black whitespace-pre-wrap">{notes}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-center">
                <FileText className="h-8 w-8 text-brand-black/20 mx-auto mb-2" />
                <p className="text-sm text-brand-black/60">No notes yet</p>
                <p className="text-xs text-brand-black/50 mt-1">
                  Add observations about performance, brand fit, or negotiation strategy
                </p>
              </div>
            )}

            {/* Prompts */}
            {!notes && (
              <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs uppercase tracking-[0.1em] font-semibold text-blue-900 mb-3">
                  Consider capturing
                </p>
                <ul className="text-xs text-blue-800 space-y-2">
                  <li>✓ Why does this creator's content perform well?</li>
                  <li>✓ Brand fit: Which categories align best?</li>
                  <li>✓ Leverage points for negotiations</li>
                  <li>✓ Risk factors or opportunities</li>
                  <li>✓ Long-term potential or growth trajectory</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          // Edit mode
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your insights... Why does this creator succeed? Brand fit analysis? Negotiation leverage?"
              className="w-full rounded-2xl border border-brand-black/10 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50 resize-none h-32"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditing(false);
                  setNotes(notes); // Keep current value
                }}
                className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-brand-black/5 transition"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>

              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold transition ${
                  saving
                    ? "bg-brand-black/10 text-brand-black/60 cursor-not-allowed"
                    : "bg-brand-red text-white hover:bg-brand-red/90"
                }`}
              >
                <Save className="h-3 w-3" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Comparison Notes (if in comparison mode) */}
      {comparisonProfile && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-brand-red" />
              <div>
                <h3 className="font-display text-2xl uppercase text-brand-black">Comparison Notes</h3>
                <p className="text-xs text-brand-black/60 mt-1">
                  {profile.name} vs {comparisonProfile.name}
                </p>
              </div>
            </div>

            {comparisonProfile.type === "talent" && !editingComparison && (
              <button
                onClick={() => setEditingComparison(true)}
                className="flex items-center gap-2 rounded-full border border-brand-black/20 px-3 py-2 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-brand-black/5 transition"
              >
                <Plus className="h-3 w-3" />
                {comparisonNotes ? "Edit" : "Add"}
              </button>
            )}
          </div>

          {!editingComparison ? (
            <div className="space-y-4">
              {comparisonNotes ? (
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
                  <p className="text-sm text-brand-black whitespace-pre-wrap">{comparisonNotes}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-center">
                  <FileText className="h-8 w-8 text-brand-black/20 mx-auto mb-2" />
                  <p className="text-sm text-brand-black/60">No comparison notes</p>
                  <p className="text-xs text-brand-black/50 mt-1">
                    Capture differences, similarities, or strategic insights from comparing these profiles
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={comparisonNotes}
                onChange={(e) => setComparisonNotes(e.target.value)}
                placeholder="Key differences? Similar audiences? Which creator is better for this campaign?"
                className="w-full rounded-2xl border border-brand-black/10 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50 resize-none h-32"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingComparison(false);
                    setComparisonNotes(comparisonNotes);
                  }}
                  className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-brand-black/5 transition"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>

                <button
                  onClick={handleSaveComparisonNotes}
                  disabled={saving}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold transition ${
                    saving
                      ? "bg-brand-black/10 text-brand-black/60 cursor-not-allowed"
                      : "bg-brand-red text-white hover:bg-brand-red/90"
                  }`}
                >
                  <Save className="h-3 w-3" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
