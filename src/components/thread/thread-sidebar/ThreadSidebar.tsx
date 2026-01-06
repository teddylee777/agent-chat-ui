"use client";

import { useEffect, useRef } from "react";
import { X, Plus, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThreads } from "@/hooks/useThreads";
import { useThreadBackgroundStatus } from "@/hooks/useThreadBackgroundStatus";
import { ThreadItem } from "./ThreadItem";

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

  if (!isOpen) return null;

  return (
    <aside
      role="complementary"
      className="absolute left-0 top-0 z-20 flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      style={{ width: 280 }}
    >
      {/* Header */}
      <div className="flex h-[65px] items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <History className="size-5 text-gray-600 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">
            Threads
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="size-8"
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* New Thread Button */}
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <Button
          className="w-full justify-start gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          onClick={handleNewThread}
          aria-label="New thread"
        >
          <Plus className="size-4" />
          New Thread
        </Button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-2">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="mr-2 size-4" />
              Retry
            </Button>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <History className="size-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No threads yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Start a conversation to create a thread
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
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
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
