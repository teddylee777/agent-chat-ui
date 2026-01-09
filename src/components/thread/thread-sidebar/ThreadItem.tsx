"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Check, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import type { Thread, ThreadBackgroundStatus, RunStatus } from "@/lib/types/agent-builder";

interface ThreadItemProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (threadId: string) => void;
  backgroundStatus?: ThreadBackgroundStatus | null;
  collapsed?: boolean;
}

// Status indicator for background runs
function StatusIndicator({ status }: { status: RunStatus }) {
  const colors: Record<RunStatus, string> = {
    pending: "bg-yellow-500",
    running: "bg-yellow-500",
    success: "bg-green-500",
    error: "bg-red-500",
    cancelled: "bg-gray-500",
  };

  const isAnimated = status === "pending" || status === "running";

  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        colors[status],
        isAnimated && "animate-pulse"
      )}
      title={status === "pending" || status === "running" ? "Background run in progress" : status === "success" ? "Completed" : "Error"}
    />
  );
}

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function ThreadItem({
  thread,
  isSelected,
  onClick,
  onDelete,
  backgroundStatus,
  collapsed,
}: ThreadItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [deleteConfirmMode, setDeleteConfirmMode] = useState(false);

  const preview = thread.metadata?.first_message || "New conversation";
  const formattedDate = format(new Date(thread.updated_at), "yyyy-MM-dd HH:mm");

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmMode(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(thread.thread_id);
    setDeleteConfirmMode(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setDeleteConfirmMode(false);
  };

  // Collapsed mode: show only status indicator or message icon with tooltip
  if (collapsed) {
    const hasActiveStatus =
      backgroundStatus &&
      (backgroundStatus.status === "pending" ||
        backgroundStatus.status === "running" ||
        !backgroundStatus.viewed);

    return (
      <TooltipIconButton
        tooltip={truncateText(preview)}
        variant="ghost"
        className={cn(
          "size-10 p-1",
          isSelected && "bg-gray-100 dark:bg-gray-800"
        )}
        onClick={onClick}
      >
        {hasActiveStatus ? (
          <StatusIndicator status={backgroundStatus!.status} />
        ) : (
          <MessageSquare className="size-5 text-gray-500 dark:text-gray-400" />
        )}
      </TooltipIconButton>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-selected={isSelected}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col gap-1 rounded-lg px-3 py-2 text-left transition-colors overflow-hidden",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isSelected && "bg-gray-100 dark:bg-gray-800"
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 min-w-0 pr-8">
        {backgroundStatus &&
          // pending/running: 항상 표시 (viewed 무관)
          // success/error: viewed가 false일 때만 표시
          (backgroundStatus.status === "pending" ||
            backgroundStatus.status === "running" ||
            !backgroundStatus.viewed) && (
            <StatusIndicator status={backgroundStatus.status} />
          )}
        <span className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {truncateText(preview)}
        </span>
      </div>
      {/* 휴지통 버튼 - 항상 우측 중앙에 고정 */}
      {isHovered && !deleteConfirmMode && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 size-6 shrink-0"
          onClick={handleDeleteClick}
          aria-label="Delete thread"
        >
          <Trash2 className="size-3.5 text-gray-500" />
        </Button>
      )}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <span>{formattedDate}</span>
      </div>

      {/* 삭제 확인 슬라이딩 오버레이 */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-[15%] min-w-[40px] items-center justify-center bg-red-500 transition-transform duration-200 ease-out rounded-r-lg cursor-pointer",
          deleteConfirmMode ? "translate-x-0" : "translate-x-full"
        )}
        onClick={handleConfirmDelete}
        aria-label="Confirm delete"
      >
        <Check className="size-4 text-white" />
      </div>
    </div>
  );
}
