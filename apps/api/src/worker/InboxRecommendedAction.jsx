import React, { useState } from "react";
import * as inboxApi from "../../services/inboxApi";

export default function InboxRecommendedAction({ email }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!email.aiRecommendedAction) return;
    setLoading(true);
    try {
      if (email.aiCategory === "deal") {
        await inboxApi.createDealDraft(email.id);
        // Show success toast
      }
      // Add other actions here for 'invite', 'gifting', etc.
    } catch (error) {
      // Show error toast
      console.error("Failed to apply action:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="font-bold text-lg">Recommended Action</h3>
      <p className="my-2">{email.aiRecommendedAction || "No action recommended."}</p>
      <button onClick={handleAction} disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
        {loading ? "Applying..." : "Apply Action"}
      </button>
    </div>
  );
}