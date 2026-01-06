"use client";

import { useState, useCallback, useEffect } from "react";
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

  // Initialize with empty state to avoid hydration mismatch
  // (Server returns {}, Client reads localStorage which may have data)
  const [statusMap, setStatusMap] = useState<ThreadStatusMap>({});

  // Load from localStorage after hydration
  useEffect(() => {
    const fresh = loadFromStorage(storageKey);
    setStatusMap(fresh);
  }, [storageKey]);

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
      setStatusMap(() => {
        // Always read fresh from localStorage to avoid stale state
        // (other hook instances may have deleted entries)
        const fresh = loadFromStorage(storageKey);
        const next = { ...fresh, [threadId]: status };
        saveToStorage(next);
        return next;
      });
    },
    [storageKey, saveToStorage]
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
      setStatusMap(() => {
        // Always read fresh from localStorage to avoid stale state
        // (other hook instances or BackgroundRunManager may have updated it)
        const fresh = loadFromStorage(storageKey);
        const existing = fresh[threadId];
        if (!existing) return fresh;

        // If already viewed, no need to update
        if (existing.viewed) return fresh;

        // If status is success or error, mark as viewed and remove
        if (existing.status === "success" || existing.status === "error") {
          const next = { ...fresh };
          delete next[threadId];
          saveToStorage(next);
          // Defer event to next tick to avoid setState during render
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("background-status-update"));
          }, 0);
          return next;
        }

        // For other statuses (pending, running), just mark as viewed
        const next = {
          ...fresh,
          [threadId]: { ...existing, viewed: true },
        };
        saveToStorage(next);
        // Defer event to next tick to avoid setState during render
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("background-status-update"));
        }, 0);
        return next;
      });
    },
    [storageKey, saveToStorage]
  );

  const clearStatus = useCallback(
    (threadId: string) => {
      setStatusMap((prev) => {
        const next = { ...prev };
        delete next[threadId];
        saveToStorage(next);
        // Defer event to next tick to avoid setState during render
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("background-status-update"));
        }, 0);
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

  // Listen for background-status-update events from BackgroundRunManager
  useEffect(() => {
    const handleUpdate = () => {
      const fresh = loadFromStorage(storageKey);
      setStatusMap(fresh);
    };

    window.addEventListener("background-status-update", handleUpdate);
    return () => window.removeEventListener("background-status-update", handleUpdate);
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
