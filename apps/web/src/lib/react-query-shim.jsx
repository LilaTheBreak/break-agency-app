import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const QueryClientContext = React.createContext(null);

class QueryClient {
  constructor() {
    this.store = new Map();
    this.listeners = new Set();
  }

  getKey(key) {
    return JSON.stringify(key ?? []);
  }

  getQueryData(key) {
    const entry = this.store.get(this.getKey(key));
    return entry?.data;
  }

  setQueryData(key, data) {
    const hash = this.getKey(key);
    const entry = this.store.get(hash) || {};
    this.store.set(hash, { ...entry, data, error: null, status: "success", updatedAt: Date.now() });
    this.notify();
  }

  setQueryError(key, error) {
    const hash = this.getKey(key);
    const entry = this.store.get(hash) || {};
    this.store.set(hash, { ...entry, error, status: "error", updatedAt: Date.now() });
    this.notify();
  }

  async fetchQuery({ queryKey, queryFn }) {
    const data = await queryFn();
    this.setQueryData(queryKey, data);
    return data;
  }

  invalidateQueries({ queryKey }) {
    const hash = this.getKey(queryKey);
    this.store.delete(hash);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }
}

function useStore(queryClient, key) {
  const [, forceRender] = useState(0);
  useEffect(() => queryClient.subscribe(() => forceRender((prev) => prev + 1)), [queryClient]);
  const data = queryClient.getQueryData(key);
  const entry = queryClient.store.get(queryClient.getKey(key)) || {};
  return { data, error: entry.error, status: entry.status };
}

export function QueryClientProvider({ client, children }) {
  return <QueryClientContext.Provider value={client}>{children}</QueryClientContext.Provider>;
}

export { QueryClient };

export function useQueryClient() {
  const client = useContext(QueryClientContext);
  if (!client) throw new Error("QueryClient not available");
  return client;
}

export function useQuery({ queryKey, queryFn, enabled = true }) {
  const queryClient = useQueryClient();
  const [fetching, setFetching] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);
  const { data, error, status } = useStore(queryClient, queryKey);

  useEffect(() => {
    if (!enabled) return;
    const run = async () => {
      setFetching(true);
      try {
        await queryClient.fetchQuery({ queryKey, queryFn });
      } catch (err) {
        queryClient.setQueryError(queryKey, err);
      } finally {
        if (mounted.current) setFetching(false);
      }
    };
    // Only fetch when data missing
    if (status !== "success") run();
  }, [enabled, queryFn, queryKey, queryClient, status]);

  return {
    data,
    error,
    status: data ? "success" : error ? "error" : fetching ? "loading" : "idle",
    isFetching: fetching
  };
}

export function useMutation({ mutationFn, onSuccess }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = useCallback(
    async (variables) => {
      setIsLoading(true);
      try {
        const result = await mutationFn(variables);
        onSuccess?.(result, variables, queryClient);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, queryClient]
  );

  const mutate = useCallback(
    (variables, opts = {}) => {
      mutateAsync(variables)
        .then((data) => opts.onSuccess?.(data))
        .catch((error) => opts.onError?.(error));
    },
    [mutateAsync]
  );

  return { mutate, mutateAsync, isLoading };
}
