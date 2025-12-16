import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchThreads, sendMessage as sendMessageApi, markMessageRead } from "../services/messagingClient.js";

const MESSAGING_PATHS = ["/admin/messaging", "/ugc/messages", "/messages"];

function isMessagingRoute(pathname = "") {
  return MESSAGING_PATHS.some((route) => pathname.startsWith(route));
}

export function useRemoteMessaging(session, enabled = true) {
  const queryClient = useQueryClient();
  const userId = session?.id || null;
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const shouldFetch = enabled && Boolean(userId) && isMessagingRoute(pathname);

  const threadsQuery = useQuery({
    queryKey: ["messages", "threads", userId],
    queryFn: () => fetchThreads(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1
  });

  const sendMutation = useMutation({
    mutationFn: ({ recipientId, content }) => sendMessageApi({ recipientId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "threads", userId] });
    }
  });

  const markMutation = useMutation({
    mutationFn: (messageId) => markMessageRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "threads", userId] });
    }
  });

  const threads = useMemo(() => threadsQuery.data?.threads ?? [], [threadsQuery.data]);

  const sendMessage = useCallback(
    async (threadId, payload) => {
      if (!shouldFetch || !threadId || !payload?.body?.trim()) return;
      await sendMutation.mutateAsync({ recipientId: threadId, content: payload.body.trim() });
    },
    [shouldFetch, sendMutation]
  );

  const markThreadRead = useCallback(
    async (threadId) => {
      if (!shouldFetch) return;
      const thread = threads.find((entry) => entry.id === threadId);
      if (!thread) return;
      const unread = thread.messages?.filter(
        (message) => message.recipientId === userId && !message.read
      );
      if (!unread?.length) return;
      await Promise.all(unread.map((message) => markMutation.mutateAsync(message.id)));
    },
    [shouldFetch, threads, markMutation, userId]
  );

  return {
    enabled: shouldFetch,
    threads,
    connectionStatus: threadsQuery.isFetching ? "syncing" : "connected",
    sendMessage,
    markThreadRead
  };
}
