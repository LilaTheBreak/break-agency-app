import { useCallback, useEffect, useState } from "react";
import { fetchUserCampaigns } from "../services/campaignClient.js";

export function useCampaigns({ session, userId } = {}) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session?.email && !userId) {
      setCampaigns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetchUserCampaigns({ session, userId });
      setCampaigns(response.campaigns ?? []);
      // Clear error on success
      setError("");
    } catch (err) {
      // On error, set empty campaigns and clear error (graceful degradation)
      setCampaigns([]);
      setError("");
    } finally {
      setLoading(false);
    }
  }, [session, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { campaigns, loading, error, reload: load };
}
