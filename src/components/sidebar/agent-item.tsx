"use client";

import { useEffect } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentSummary } from "@/lib/types/agent-builder";
import { useRouter } from "next/navigation";
import { useThreadBackgroundStatus } from "@/hooks/useThreadBackgroundStatus";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

interface AgentItemProps {
  agent: AgentSummary;
  isSelected: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

type BackgroundState = "idle" | "active" | "completed";

export function AgentItem({
  agent,
  isSelected,
  onClick,
  collapsed,
}: AgentItemProps) {
  const router = useRouter();
  const { getAllStatuses, refreshFromStorage } = useThreadBackgroundStatus(agent.agent_id);

  // Force refresh hook state when background status updates
  useEffect(() => {
    const handleBackgroundStatusUpdate = () => {
      refreshFromStorage();
    };

    window.addEventListener("background-status-update", handleBackgroundStatusUpdate);
    return () => window.removeEventListener("background-status-update", handleBackgroundStatusUpdate);
  }, [refreshFromStorage]);

  // Calculate overall background state for this agent
  const getAgentBackgroundState = (): BackgroundState => {
    const statuses = getAllStatuses();
    const entries = Object.values(statuses);

    if (entries.length === 0) return "idle";

    // If any thread has pending/running status → "active"
    const hasActive = entries.some(
      (s) => s.status === "pending" || s.status === "running"
    );
    if (hasActive) return "active";

    // If any thread has unviewed success → "completed"
    const hasUnviewedSuccess = entries.some(
      (s) => s.status === "success" && !s.viewed
    );
    if (hasUnviewedSuccess) return "completed";

    return "idle";
  };

  const bgState = getAgentBackgroundState();

  // Logo background color based on state
  const logoBgClass: Record<BackgroundState, string> = {
    idle: "bg-gray-200 dark:bg-gray-700",
    active: "bg-yellow-400 dark:bg-yellow-500",
    completed: "bg-green-400 dark:bg-green-500",
  };

  // Icon color for contrast
  const iconClass =
    bgState === "idle"
      ? "text-gray-600 dark:text-gray-400"
      : "text-white";

  const handleClick = () => {
    onClick();
    router.push(`/agent/${agent.agent_id}`);
  };

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <TooltipIconButton
          tooltip={agent.agent_name}
          variant="ghost"
          className={cn(
            "size-10 p-1",
            isSelected && "bg-gray-100 dark:bg-gray-800"
          )}
          onClick={handleClick}
        >
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              logoBgClass[bgState],
              bgState === "active" && "animate-pulse"
            )}
          >
            <Bot className={cn("size-4", iconClass)} />
          </div>
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start gap-3 px-3 py-2 text-left font-normal",
        isSelected && "bg-gray-100 dark:bg-gray-800"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          logoBgClass[bgState],
          bgState === "active" && "animate-pulse"
        )}
      >
        <Bot className={cn("size-4", iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
          {agent.agent_name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {agent.agent_description}
        </p>
      </div>
    </Button>
  );
}
