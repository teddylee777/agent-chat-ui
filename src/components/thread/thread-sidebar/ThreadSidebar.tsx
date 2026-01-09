"use client";

import { useEffect, useRef } from "react";
import { X, Plus, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThreads } from "@/hooks/useThreads";
import { useThreadBackgroundStatus } from "@/hooks/useThreadBackgroundStatus";
import { ThreadItem } from "./ThreadItem";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { cn } from "@/lib/utils";

const THREAD_SIDEBAR_EXPANDED_WIDTH = 280;
const THREAD_SIDEBAR_COLLAPSED_WIDTH = 64;

interface ThreadSidebarProps {
  agentId: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewThread: () => void;
  onSelectThread: (threadId: string) => void;
  selectedThreadId?: string | null;
  refetchTrigger?: number; // Increment to trigger thread list refetch
}

export function ThreadSidebar({
  agentId,
  isOpen,
  onToggle,
  onNewThread,
  onSelectThread,
  selectedThreadId: externalSelectedId,
  refetchTrigger,
}: ThreadSidebarProps) {
  const {
    threads,
    error,
    selectedThreadId,
    selectThread,
    deleteThread,
    refetch,
  } = useThreads(agentId);

  const { getStatus, markViewed, refreshFromStorage } = useThreadBackgroundStatus(agentId);

  // Refetch threads when trigger changes (e.g., after background run starts)
  const prevTriggerRef = useRef(refetchTrigger);
  useEffect(() => {
    if (refetchTrigger !== undefined && refetchTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = refetchTrigger;
      refetch();
      // Also refresh background status from localStorage to sync with other hook instances
      refreshFromStorage();
    }
  }, [refetchTrigger, refetch, refreshFromStorage]);

  const handleSelectThread = (threadId: string) => {
    selectThread(threadId);
    onSelectThread(threadId);
    // Mark as viewed when thread is selected
    markViewed(threadId);
  };

  const handleNewThread = () => {
    selectThread(null);
    onNewThread();
  };

  const collapsed = !isOpen;
  const sidebarWidth = collapsed
    ? THREAD_SIDEBAR_COLLAPSED_WIDTH
    : THREAD_SIDEBAR_EXPANDED_WIDTH;

  return (
    <aside
      role="complementary"
      className={cn(
        "absolute left-0 top-0 z-20 flex h-full flex-col border-r border-gray-200 bg-white transition-[width] duration-200 ease-out dark:border-gray-700 dark:bg-gray-900",
        collapsed ? "w-16" : "w-[280px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-[65px] items-center border-b border-gray-200 dark:border-gray-700",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <TooltipIconButton
          tooltip={collapsed ? "Expand threads" : "Collapse threads"}
          variant="ghost"
          className="size-9"
          onClick={onToggle}
        >
          <History className="size-5 text-gray-600 dark:text-gray-400" />
        </TooltipIconButton>

        {!collapsed && (
          <>
            <h2 className="flex-1 pl-2 font-semibold text-gray-900 dark:text-gray-50">
              Threads
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="size-8"
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </Button>
          </>
        )}
      </div>

      {/* New Thread Button */}
      <div
        className={cn(
          "border-b border-gray-200 dark:border-gray-700",
          collapsed ? "flex justify-center py-2" : "px-3 py-2"
        )}
      >
        {collapsed ? (
          <TooltipIconButton
            tooltip="New Thread"
            variant="ghost"
            className="size-10 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            onClick={handleNewThread}
          >
            <Plus className="size-5" />
          </TooltipIconButton>
        ) : (
          <Button
            className="w-full justify-start gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            onClick={handleNewThread}
            aria-label="New thread"
          >
            <Plus className="size-4" />
            New Thread
          </Button>
        )}
      </div>

      {/* Thread List */}
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          collapsed ? "p-1" : "p-2"
        )}
      >
        {error ? (
          <div
            className={cn(
              "flex flex-col items-center gap-3 text-center",
              collapsed ? "py-4" : "py-8"
            )}
          >
            {collapsed ? (
              <TooltipIconButton
                tooltip="Error - Click to retry"
                variant="ghost"
                className="size-10"
                onClick={refetch}
              >
                <RefreshCw className="size-5 text-red-500" />
              </TooltipIconButton>
            ) : (
              <>
                <p className="text-sm text-red-500">{error}</p>
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="mr-2 size-4" />
                  Retry
                </Button>
              </>
            )}
          </div>
        ) : threads.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center gap-2 text-center",
              collapsed ? "py-4" : "py-8"
            )}
          >
            <History
              className={cn(
                "text-gray-300 dark:text-gray-600",
                collapsed ? "size-6" : "size-10"
              )}
            />
            {!collapsed && (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No threads yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Start a conversation to create a thread
                </p>
              </>
            )}
          </div>
        ) : (
          <div className={cn("flex flex-col", collapsed ? "items-center gap-1" : "gap-1")}>
            {threads.map((thread) => (
              <ThreadItem
                key={thread.thread_id}
                thread={thread}
                isSelected={
                  (externalSelectedId ?? selectedThreadId) ===
                  thread.thread_id
                }
                onClick={() => handleSelectThread(thread.thread_id)}
                onDelete={deleteThread}
                backgroundStatus={getStatus(thread.thread_id)}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
