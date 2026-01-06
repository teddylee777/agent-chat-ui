"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ToolList } from "./tool-list";
import { ToolDetail } from "./tool-detail";
import { AddToolDialog } from "./add-tool-dialog";
import {
  getTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
} from "@/lib/api/agent-builder";
import type {
  ToolSummary,
  ToolInfo,
  ToolCreateRequest,
  ToolUpdateRequest,
} from "@/lib/types/agent-builder";

export function ToolsScreen() {
  const router = useRouter();
  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [selectedToolName, setSelectedToolName] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolInfo | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load tools list
  const loadTools = useCallback(async () => {
    try {
      const response = await getTools();
      setTools(response.tools);
    } catch (error) {
      console.error("Failed to load tools:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoadingList(true);
    loadTools().finally(() => setIsLoadingList(false));
  }, [loadTools]);

  // Load selected tool detail
  useEffect(() => {
    if (!selectedToolName) {
      setSelectedTool(null);
      return;
    }

    const loadToolDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const tool = await getTool(selectedToolName);
        setSelectedTool(tool);
      } catch (error) {
        console.error("Failed to load tool:", error);
        setSelectedTool(null);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    loadToolDetail();
  }, [selectedToolName]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTools();
    if (selectedToolName) {
      try {
        const tool = await getTool(selectedToolName);
        setSelectedTool(tool);
      } catch {
        setSelectedToolName(null);
        setSelectedTool(null);
      }
    }
    setIsRefreshing(false);
  };

  const handleAddTool = async (data: ToolCreateRequest) => {
    await createTool(data);
    await loadTools();
    setSelectedToolName(data.tool_name);
  };

  const handleSaveTool = async (toolName: string, data: ToolUpdateRequest) => {
    const response = await updateTool(toolName, data);
    // Use the returned tool_name (may be different if renamed)
    const finalToolName = response.tool_name;
    const updatedTool = await getTool(finalToolName);
    setSelectedTool(updatedTool);
    setSelectedToolName(finalToolName);
    await loadTools();
  };

  const handleDeleteTool = async (toolName: string) => {
    await deleteTool(toolName);
    setSelectedToolName(null);
    setSelectedTool(null);
    await loadTools();
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="size-9"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Tools
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage tool configurations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 size-4" />
            )}
            Refresh
          </Button>
          <AddToolDialog onAdd={handleAddTool} />
        </div>
      </div>

      {/* Split Panel Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[385px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
          <ToolList
            tools={tools}
            selectedTool={selectedToolName}
            onSelectTool={setSelectedToolName}
            isLoading={isLoadingList}
          />
        </div>
        <div className="flex-1">
          <ToolDetail
            tool={selectedTool}
            isLoading={isLoadingDetail}
            onSave={handleSaveTool}
            onDelete={handleDeleteTool}
          />
        </div>
      </div>
    </div>
  );
}
