"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Thread, ThreadBackgroundStatus, RunStatus } from "@/lib/types/agent-builder";

interface ThreadItemProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (threadId: string) => void;
  backgroundStatus?: ThreadBackgroundStatus | null;
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
}: ThreadItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const preview = thread.metadata?.first_message || "New conversation";
  const formattedDate = format(new Date(thread.updated_at), "yyyy-MM-dd HH:mm");

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete(thread.thread_id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-selected={isSelected}
      className={cn(
        "group flex w-full cursor-pointer flex-col gap-1 rounded-lg px-3 py-2 text-left transition-colors",
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
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
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
        {isHovered && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={handleDeleteClick}
            aria-label="Delete thread"
          >
            <Trash2 className="size-3.5 text-gray-500" />
          </Button>
        )}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <span>{formattedDate}</span>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>대화 삭제</DialogTitle>
            <DialogDescription>
              이 대화를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
