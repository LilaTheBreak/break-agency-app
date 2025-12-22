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
      setPendingUsers(response.data);
    } catch (err) {
      console.error("Error fetching pending users:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setError(err.response?.data?.error || "Failed to load pending users");
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
      
      // Remove from list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
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
      
      // Remove from list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError("Failed to reject user");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Approve New Users</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4">Approve New Users</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <p className="text-gray-500">No pending user approvals</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name || "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleApprove(user.id, user.email)}
                      disabled={processingId === user.id}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === user.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(user.id, user.email)}
                      disabled={processingId === user.id}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === user.id ? "Processing..." : "Reject"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
