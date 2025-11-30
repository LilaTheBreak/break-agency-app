import { useQuery, useMutation, useQueryClient } from "../lib/react-query-shim.jsx";
import { fetchTimeline, addNote } from "../services/dealTimelineClient.js";

export function useDealTimeline(dealId) {
  const client = useQueryClient();

  const timelineQuery = useQuery({
    queryKey: ["deal-timeline", dealId],
    queryFn: () => fetchTimeline(dealId),
    enabled: Boolean(dealId)
  });

  const addNoteMutation = useMutation({
    mutationFn: (message) => addNote(dealId, message),
    onSuccess: () => client.invalidateQueries({ queryKey: ["deal-timeline", dealId] })
  });

  return {
    events: timelineQuery.data?.events || [],
    addNote: addNoteMutation.mutateAsync,
    status: timelineQuery.status
  };
}
