import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function PendingUsersApproval() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching pending users from:", `${API_URL}/api/users/pending`);
      const response = await axios.get(`${API_URL}/api/users/pending`, {
        withCredentials: true
      });
      console.log("Pending users response:", response.data);
      // Ensure data is always an array
      setPendingUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching pending users:", err);
      if (err.response?.status === 403) {
        // Permission denied - silent failure
        setPendingUsers([]);
        setError(null);
      } else if (err.response?.status === 404) {
        // Endpoint not found
        setPendingUsers([]);
        setError(null);
      } else {
        setError("Unable to load pending users");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userEmail) => {
    if (!confirm(`Approve user ${userEmail}?`)) return;

    try {
      setProcessingId(userId);
      setError(null);
      await axios.post(
        `${API_URL}/api/users/${userId}/approve`,
        {},
        { withCredentials: true }
      );
      
      setSuccessMessage(`User ${userEmail} approved successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Remove from list - ensure prev is always an array
      setPendingUsers(prev => (Array.isArray(prev) ? prev.filter(u => u.id !== userId) : []));
    } catch (err) {
      console.error("Error approving user:", err);
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
      await axios.post(
        `${API_URL}/api/users/${userId}/reject`,
        { reason },
        { withCredentials: true }
      );
      
      setSuccessMessage(`User ${userEmail} rejected`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Remove from list - ensure prev is always an array
      setPendingUsers(prev => (Array.isArray(prev) ? prev.filter(u => u.id !== userId) : []));
    } catch (err) {
      console.error("Error rejecting user:", err);
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
