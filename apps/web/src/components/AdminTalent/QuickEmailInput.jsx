import React, { useState } from "react";
import { Plus, X, Mail } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * QuickEmailInput Component
 * 
 * Inline email management with quick-add functionality.
 * Shows primary email prominently, quick-add for secondary emails.
 * Reduces form fatigue by integrating email management into the snapshot.
 */
export function QuickEmailInput({ talent, onUpdate }) {
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const primaryEmail = talent?.primaryEmail;
  const emails = Array.isArray(talent?.emails) ? talent.emails : [];

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/talent/${talent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmail: newEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add email");
      }

      toast.success("Email added successfully");
      setNewEmail("");
      setIsAddingEmail(false);
      onUpdate?.();
    } catch (err) {
      toast.error(err.message || "Failed to add email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Primary Email */}
      {primaryEmail && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-white border border-brand-black/10">
          <Mail className="h-4 w-4 text-brand-red flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">
              Primary Email
            </p>
            <p className="text-sm text-brand-black truncate">{primaryEmail}</p>
          </div>
        </div>
      )}

      {/* Secondary Emails */}
      {emails.length > 0 && (
        <div className="space-y-2">
          {emails.map((email, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-3 rounded-lg bg-brand-white border border-brand-black/10"
            >
              <Mail className="h-4 w-4 text-brand-black/40 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">
                  Email
                </p>
                <p className="text-sm text-brand-black truncate">{email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Add */}
      {!isAddingEmail ? (
        <button
          onClick={() => setIsAddingEmail(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-brand-black/20 text-xs uppercase tracking-[0.2em] text-brand-black/60 hover:bg-brand-black/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Email
        </button>
      ) : (
        <div className="p-3 rounded-lg bg-brand-white border border-brand-black/10 space-y-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddEmail();
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddEmail}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-brand-red px-3 py-2 text-xs uppercase tracking-[0.2em] text-white font-semibold hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingEmail(false);
                setNewEmail("");
              }}
              className="flex-1 flex items-center justify-center rounded-lg border border-brand-black/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-brand-black/60 hover:bg-brand-black/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
