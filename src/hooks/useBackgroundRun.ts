"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getRun } from "@/lib/api/agent-builder";
import type { Run } from "@/lib/types/agent-builder";

interface UseBackgroundRunOptions {
  onComplete?: (run: Run) => void;
  onError?: (run: Run) => void;
  pollingInterval?: number;
}

interface UseBackgroundRunResult {
  run: Run | null;
  isPolling: boolean;
  startPolling: (runId: string) => void;
  stopPolling: () => void;
}

export function useBackgroundRun(
  agentId: string,
  threadId: string | null,
  options?: UseBackgroundRunOptions
): UseBackgroundRunResult {
  const [run, setRun] = useState<Run | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRunIdRef = useRef<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const pollingInterval = options?.pollingInterval ?? 2000;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    currentRunIdRef.current = null;
  }, []);

  const poll = useCallback(async () => {
    if (!threadId || !currentRunIdRef.current) {
      stopPolling();
      return;
    }

    try {
      const runData = await getRun(agentId, threadId, currentRunIdRef.current);
      setRun(runData);

      // Check if run is completed
      if (runData.status === "success") {
        stopPolling();
        optionsRef.current?.onComplete?.(runData);
      } else if (runData.status === "error") {
        stopPolling();
        optionsRef.current?.onError?.(runData);
      } else if (runData.status === "cancelled") {
        stopPolling();
      }
    } catch (error) {
      console.error("Failed to poll run status:", error);
      // Continue polling on error - might be temporary network issue
    }
  }, [agentId, threadId, stopPolling]);

  const startPolling = useCallback(
    (runId: string) => {
      // Stop any existing polling
      stopPolling();

      if (!threadId) {
        console.warn("Cannot start polling: threadId is null");
        return;
      }

      currentRunIdRef.current = runId;
      setIsPolling(true);

      // Immediate first poll
      poll();

      // Set up interval for subsequent polls
      intervalRef.current = setInterval(poll, pollingInterval);
    },
    [threadId, poll, pollingInterval, stopPolling]
  );

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && intervalRef.current) {
        // Page is hidden - pause polling
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (!document.hidden && isPolling && currentRunIdRef.current) {
        // Page is visible again - resume polling
        poll();
        intervalRef.current = setInterval(poll, pollingInterval);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPolling, poll, pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    run,
    isPolling,
    startPolling,
    stopPolling,
  };
}
