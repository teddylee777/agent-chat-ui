"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/providers/Agent";
import { AgentItem } from "./agent-item";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

interface AgentListProps {
  collapsed?: boolean;
}

export function AgentList({ collapsed }: AgentListProps) {
  // Force re-render when background status updates
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleBackgroundStatusUpdate = () => {
      forceUpdate((prev) => prev + 1);
    };

    window.addEventListener("background-status-update", handleBackgroundStatusUpdate);
    return () => window.removeEventListener("background-status-update", handleBackgroundStatusUpdate);
  }, []);

  const {
    agents,
    selectedAgent,
    setSelectedAgent,
    isLoading,
    error,
    refetchAgents,
  } = useAgents();

  const handleRefresh = () => {
    refetchAgents();
    window.dispatchEvent(new CustomEvent("background-status-update"));
  };

  // Loading skeleton
  if (isLoading) {
    if (collapsed) {
      return (
        <div className="flex flex-1 flex-col items-center overflow-hidden min-h-0 py-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="size-8 rounded-full my-1" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            My Agents
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            disabled
            title="Refresh"
          >
            <RefreshCw className="size-3.5 animate-spin" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    if (collapsed) {
      return (
        <div className="flex flex-1 flex-col items-center overflow-hidden min-h-0 py-2">
          <TooltipIconButton
            tooltip="Error - Click to retry"
            variant="ghost"
            className="size-10 p-2"
            onClick={handleRefresh}
          >
            <AlertCircle className="size-5 text-red-500" />
          </TooltipIconButton>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            My Agents
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <AlertCircle className="size-8 text-red-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAgents()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (agents.length === 0) {
    if (collapsed) {
      return (
        <div className="flex flex-1 flex-col items-center overflow-hidden min-h-0 py-2">
          <TooltipIconButton
            tooltip="No agents yet"
            variant="ghost"
            className="size-10 p-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="size-5 text-gray-400" />
          </TooltipIconButton>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            My Agents
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No agents yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Create your first agent to get started
          </p>
        </div>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="flex flex-1 flex-col items-center overflow-hidden min-h-0 py-2">
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
          {agents.map((agent) => (
            <AgentItem
              key={agent.agent_id}
              agent={agent}
              isSelected={selectedAgent?.agent_id === agent.agent_id}
              onClick={() => setSelectedAgent(agent)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-h-0">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          My Agents
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleRefresh}
          title="Refresh"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
        {agents.map((agent) => (
          <AgentItem
            key={agent.agent_id}
            agent={agent}
            isSelected={selectedAgent?.agent_id === agent.agent_id}
            onClick={() => setSelectedAgent(agent)}
          />
        ))}
      </div>
    </div>
  );
}
