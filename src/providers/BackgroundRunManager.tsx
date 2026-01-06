"use client";

import React, { createContext, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getRun } from "@/lib/api/agent-builder";
import type { ThreadBackgroundStatus } from "@/lib/types/agent-builder";

const STORAGE_KEY_PREFIX = "agent-chat:background-status:";
const POLLING_INTERVAL = 2000;
const MAX_FAIL_COUNT = 3;  // 연속 실패 시 상태 삭제 임계값

interface BackgroundRunManagerContextType {
  // Context for future extensions if needed
}

const BackgroundRunManagerContext = createContext<BackgroundRunManagerContextType>({});

export function BackgroundRunManager({ children }: { children: React.ReactNode }) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll all pending/running background runs from localStorage
  const pollAllPendingRuns = useCallback(async () => {
    if (typeof window === "undefined") return;

    // Get all localStorage keys that match our prefix
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));

    for (const key of keys) {
      const agentId = key.replace(STORAGE_KEY_PREFIX, "");
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const statusMap: Record<string, ThreadBackgroundStatus> = JSON.parse(stored);
        let hasUpdates = false;

        for (const [threadId, status] of Object.entries(statusMap)) {
          // Only poll pending/running statuses
          if (status.status !== "pending" && status.status !== "running") continue;

          try {
            const run = await getRun(agentId, threadId, status.runId);

            if (run.status === "success" || run.status === "error") {
              // Update status in map (reset failCount on success)
              statusMap[threadId] = { ...status, status: run.status, failCount: 0 };
              hasUpdates = true;

              // Show notification
              if (run.status === "success") {
                toast.success("Background run completed", {
                  description: "Your request has been processed.",
                  duration: 5000,
                });
              } else {
                toast.error("Background run failed", {
                  description: run.error || "An error occurred.",
                  duration: 5000,
                });
              }
            } else {
              // 성공적으로 폴링됨 → failCount 리셋
              if (status.failCount && status.failCount > 0) {
                statusMap[threadId] = { ...status, failCount: 0 };
                hasUpdates = true;
              }
            }
          } catch (error) {
            console.error("Failed to poll run:", error);

            // 연속 실패 카운트 증가
            const failCount = (status.failCount || 0) + 1;

            if (failCount >= MAX_FAIL_COUNT) {
              // N회 연속 실패 → 상태 삭제 (orphaned status)
              delete statusMap[threadId];
              hasUpdates = true;
              toast.warning("Background run not found", {
                description: "The run may have been cancelled or expired.",
                duration: 5000,
              });
            } else {
              // 실패 카운트 업데이트
              statusMap[threadId] = { ...status, failCount };
              hasUpdates = true;
            }
          }
        }

        // Save updates to localStorage and notify components
        if (hasUpdates) {
          localStorage.setItem(key, JSON.stringify(statusMap));
          // Dispatch custom event to notify useThreadBackgroundStatus hooks
          window.dispatchEvent(new CustomEvent("background-status-update"));
        }
      } catch (error) {
        console.error("Failed to parse status map:", error);
      }
    }
  }, []);

  // Start global polling on mount
  useEffect(() => {
    // Initial poll
    pollAllPendingRuns();

    // Set up interval
    intervalRef.current = setInterval(pollAllPendingRuns, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollAllPendingRuns]);

  // Handle visibility changes - pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when visible
        pollAllPendingRuns();
        intervalRef.current = setInterval(pollAllPendingRuns, POLLING_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pollAllPendingRuns]);

  return (
    <BackgroundRunManagerContext.Provider value={{}}>
      {children}
    </BackgroundRunManagerContext.Provider>
  );
}
