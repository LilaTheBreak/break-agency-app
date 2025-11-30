import { useEffect } from "react";
import { useQuery, useQueryClient } from "../lib/react-query-shim.jsx";
import { fetchDealInsights } from "../services/dealInsightsClient.js";

export function useDealInsights(dealId) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["deal-insights", dealId],
    queryFn: () => fetchDealInsights(dealId),
    enabled: Boolean(dealId)
  });

  useEffect(() => {
    if (!dealId) return;
    const id = setInterval(() => {
      queryClient.fetchQuery({ queryKey: ["deal-insights", dealId], queryFn: () => fetchDealInsights(dealId) });
    }, 1000 * 60 * 5);
    return () => clearInterval(id);
  }, [dealId, queryClient]);

  return query;
}
