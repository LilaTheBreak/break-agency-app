import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/apiClient.js";

export default function PendingUsersApproval() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/admin/users/pending");
      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          // Permission denied or not found - show empty state
          setPendingUsers([]);
          return;
        }
        throw new Error(`Failed to fetch pending users: ${response.status}`);
      }
      const data = await response.json();
      // The API returns { users: [...] }, so extract the users array
      setPendingUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Error fetching pending users:", err);
      toast.error(`Failed to load pending users: ${err.message}`);
      setError("Unable to load pending users");
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userEmail) => {
    if (!confirm(`Approve user ${userEmail}?`)) return;

    try {
      setProcessingId(userId);
      setError(null);
      const response = await apiFetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to approve user: ${response.status}`);
      }
      
      toast.success(`✓ User ${userEmail} approved successfully`);
      
      // Remove from list - ensure prev is always an array
      setPendingUsers(prev => (Array.isArray(prev) ? prev.filter(u => u.id !== userId) : []));
    } catch (err) {
      console.error("Error approving user:", err);
      toast.error(`Failed to approve user: ${err.message}`);
      setError("Failed to approve user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId, userEmail) => {
    const reason = prompt(`Reject user ${userEmail}? Enter reason (optional):`);
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(userId);
      setError(null);
      const response = await apiFetch(`/api/admin/users/${userId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reject user: ${response.status}`);
      }
      
      toast.success(`User ${userEmail} rejected`);
      
      // Remove from list - ensure prev is always an array
      setPendingUsers(prev => (Array.isArray(prev) ? prev.filter(u => u.id !== userId) : []));
    } catch (err) {
      console.error("Error rejecting user:", err);
      toast.error(`Failed to reject user: ${err.message}`);
      setError("Failed to reject user");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Admin</p>
          <h3 className="font-display text-3xl uppercase">Approve new users</h3>
          <p className="mt-1 text-sm text-brand-black/60">Review and approve newly registered users</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-sm text-brand-black/80">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-sm font-semibold text-brand-black">{successMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">Loading pending approvals...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">No pending user approvals</p>
          <p className="mt-2 text-xs text-brand-black/40">New sign-ups will appear here when awaiting review</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {Array.isArray(pendingUsers) && pendingUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-brand-black">{user.name || "—"}</p>
                    <span className="inline-flex items-center rounded-full border border-brand-black/20 bg-brand-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/80">
                      {user.role}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-brand-black/60">{user.email}</p>
                  <p className="mt-1 text-xs text-brand-black/40">
                    Applied {new Date(user.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleApprove(user.id, user.email)}
                    disabled={processingId === user.id}
                    className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === user.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(user.id, user.email)}
                    disabled={processingId === user.id}
                    className="rounded-full border border-brand-black/20 bg-brand-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black transition hover:bg-brand-linen/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === user.id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
