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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [session, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { campaigns, loading, error, reload: load };
}
