import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/apiClient.js";

/**
 * Fetches inbox items grouped by smart AI categories
 * API returns: { deals: [], negotiations: [], gifting: [], invites: [], vip: [], urgent: [], spam: [] }
 */
export function useInboxCategories() {
  const query = useQuery({
    queryKey: ["inbox", "categories"],
    queryFn: async () => {
      const response = await apiFetch("/api/inbox/categories");
      if (!response.ok) {
        throw new Error(`Failed to fetch inbox categories: ${response.status}`);
      }
      const result = await response.json();
      return result.data || {};
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    categories: query.data || {},
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
