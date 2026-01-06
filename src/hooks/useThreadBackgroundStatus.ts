"use client";

import { useState, useCallback } from "react";
import type { RunStatus, ThreadBackgroundStatus } from "@/lib/types/agent-builder";

const STORAGE_KEY_PREFIX = "agent-chat:background-status:";

interface ThreadStatusMap {
  [threadId: string]: ThreadBackgroundStatus;
}

interface UseThreadBackgroundStatusResult {
  getStatus: (threadId: string) => ThreadBackgroundStatus | null;
  setStatus: (threadId: string, status: ThreadBackgroundStatus) => void;
  updateStatus: (threadId: string, status: RunStatus) => void;
  markViewed: (threadId: string) => void;
  clearStatus: (threadId: string) => void;
  getAllStatuses: () => ThreadStatusMap;
  refreshFromStorage: () => void;
}

// Helper to load from localStorage synchronously
function loadFromStorage(storageKey: string): ThreadStatusMap {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load background status from localStorage:", error);
    return {};
  }
}

export function useThreadBackgroundStatus(
  agentId: string
): UseThreadBackgroundStatusResult {
  const storageKey = `${STORAGE_KEY_PREFIX}${agentId}`;

  // Initialize from localStorage synchronously to avoid flash of empty state
  const [statusMap, setStatusMap] = useState<ThreadStatusMap>(() =>
    loadFromStorage(storageKey)
  );

  // Save to localStorage whenever statusMap changes
  const saveToStorage = useCallback(
    (map: ThreadStatusMap) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(storageKey, JSON.stringify(map));
      } catch (error) {
        console.error("Failed to save background status to localStorage:", error);
      }
    },
    [storageKey]
  );

  const getStatus = useCallback(
    (threadId: string): ThreadBackgroundStatus | null => {
      return statusMap[threadId] || null;
    },
    [statusMap]
  );

  const setStatus = useCallback(
    (threadId: string, status: ThreadBackgroundStatus) => {
      setStatusMap((prev) => {
        const next = { ...prev, [threadId]: status };
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage]
  );

  const updateStatus = useCallback(
    (threadId: string, status: RunStatus) => {
      setStatusMap((prev) => {
        const existing = prev[threadId];
        if (!existing) return prev;

        const next = {
          ...prev,
          [threadId]: { ...existing, status },
        };
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage]
  );

  const markViewed = useCallback(
    (threadId: string) => {
      setStatusMap((prev) => {
        const existing = prev[threadId];
        if (!existing) return prev;

        // If already viewed, no need to update
        if (existing.viewed) return prev;

        // If status is success or error, mark as viewed and remove
        if (existing.status === "success" || existing.status === "error") {
          const next = { ...prev };
          delete next[threadId];
          saveToStorage(next);
          return next;
        }

        // For other statuses (pending, running), just mark as viewed
        const next = {
          ...prev,
          [threadId]: { ...existing, viewed: true },
        };
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage]
  );

  const clearStatus = useCallback(
    (threadId: string) => {
      setStatusMap((prev) => {
        const next = { ...prev };
        delete next[threadId];
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage]
  );

  const getAllStatuses = useCallback((): ThreadStatusMap => {
    return statusMap;
  }, [statusMap]);

  // Re-read from localStorage to sync with other hook instances
  const refreshFromStorage = useCallback(() => {
    const fresh = loadFromStorage(storageKey);
    setStatusMap(fresh);
  }, [storageKey]);

  return {
    getStatus,
    setStatus,
    updateStatus,
    markViewed,
    clearStatus,
    getAllStatuses,
    refreshFromStorage,
  };
}
