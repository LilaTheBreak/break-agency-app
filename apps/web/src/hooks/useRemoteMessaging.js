import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchThreads, sendMessage as sendMessageApi, markMessageRead } from "../services/messagingClient.js";

export function useRemoteMessaging(session) {
  const queryClient = useQueryClient();
  const userId = session?.email || null;
  const enabled = Boolean(userId);

  const threadsQuery = useQuery({
    queryKey: ["messages", "threads", userId],
    queryFn: () => fetchThreads(session),
    enabled,
    staleTime: 1000 * 30
  });

  const sendMutation = useMutation({
    mutationFn: ({ recipientId, content }) => sendMessageApi(session, { recipientId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "threads", userId] });
    }
  });

  const markMutation = useMutation({
    mutationFn: (messageId) => markMessageRead(session, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "threads", userId] });
    }
  });

  const threads = useMemo(() => threadsQuery.data?.threads ?? [], [threadsQuery.data]);

  const sendMessage = useCallback(
    async (threadId, payload) => {
      if (!enabled || !threadId || !payload?.body?.trim()) return;
      await sendMutation.mutateAsync({ recipientId: threadId, content: payload.body.trim() });
    },
    [enabled, sendMutation]
  );

  const markThreadRead = useCallback(
    async (threadId) => {
      if (!enabled) return;
      const thread = threads.find((entry) => entry.id === threadId);
      if (!thread) return;
      const unread = thread.messages?.filter(
        (message) => message.recipientId === userId && !message.read
      );
      if (!unread?.length) return;
      await Promise.all(unread.map((message) => markMutation.mutateAsync(message.id)));
    },
    [enabled, threads, markMutation, userId]
  );

  return {
    enabled,
    threads,
    connectionStatus: threadsQuery.isFetching ? "syncing" : "connected",
    sendMessage,
    markThreadRead
  };
}
