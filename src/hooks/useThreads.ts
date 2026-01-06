"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getThreads,
  deleteThread as deleteThreadApi,
} from "@/lib/api/agent-builder";
import type { Thread, ThreadPaginationParams } from "@/lib/types/agent-builder";

export interface UseThreadsResult {
  threads: Thread[];
  isLoading: boolean;
  error: string | null;
  selectedThreadId: string | null;
  selectThread: (threadId: string | null) => void;
  deleteThread: (threadId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useThreads(
  agentId: string,
  options: ThreadPaginationParams = { limit: 20, offset: 0 }
): UseThreadsResult {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!agentId) {
      setThreads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getThreads(agentId, options);
      setThreads(response.threads);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch threads";
      setError(message);
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, options.limit, options.offset]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const selectThread = useCallback((threadId: string | null) => {
    setSelectedThreadId(threadId);
  }, []);

  const deleteThread = useCallback(
    async (threadId: string) => {
      try {
        await deleteThreadApi(agentId, threadId);
        // Deselect if deleted thread was selected
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
        }
        // Refetch list
        await fetchThreads();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete thread";
        throw new Error(message);
      }
    },
    [agentId, selectedThreadId, fetchThreads]
  );

  return useMemo(
    () => ({
      threads,
      isLoading,
      error,
      selectedThreadId,
      selectThread,
      deleteThread,
      refetch: fetchThreads,
    }),
    [
      threads,
      isLoading,
      error,
      selectedThreadId,
      selectThread,
      deleteThread,
      fetchThreads,
    ]
  );
}
