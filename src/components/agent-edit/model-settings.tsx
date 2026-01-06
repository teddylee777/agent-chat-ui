"use client";

import { useState, useEffect } from "react";
import { Cpu, Loader2 } from "lucide-react";
import { useAgentEdit } from "@/providers/AgentEdit";
import { ModelSettingsDialog } from "./model-settings-dialog";
import { getAgentModelConfig } from "@/lib/api/agent-builder";

export function ModelSettings() {
  const { editedConfig } = useAgentEdit();
  const [modelName, setModelName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Load current model config
  useEffect(() => {
    async function loadModelConfig() {
      if (!editedConfig?.agent_id) return;

      setIsLoading(true);
      try {
        const config = await getAgentModelConfig(editedConfig.agent_id);
        setModelName(config.model_name || "");
      } catch {
        // Fallback to editedConfig.model_name
        setModelName(editedConfig.model_name || "");
      } finally {
        setIsLoading(false);
      }
    }

    loadModelConfig();
  }, [editedConfig?.agent_id, editedConfig?.model_name]);

  if (!editedConfig) return null;

  // Reload model config after save
  const handleSave = async () => {
    try {
      const config = await getAgentModelConfig(editedConfig.agent_id);
      setModelName(config.model_name || "");
    } catch {
      // Ignore errors
    }
  };

  return (
    <div className="flex h-[52px] items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
      {/* Left: Icon + Label */}
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
          <Cpu className="size-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Model Settings
          </p>
        </div>
      </div>

      {/* Center: Model Name */}
      <div className="flex-1 px-4 text-center">
        {isLoading ? (
          <Loader2 className="mx-auto size-4 animate-spin text-gray-400" />
        ) : (
          <p className="truncate text-sm text-gray-500 dark:text-gray-400 font-mono">
            {modelName || "Not configured"}
          </p>
        )}
      </div>

      {/* Right: Settings Button */}
      <ModelSettingsDialog
        agentId={editedConfig.agent_id}
        onSave={handleSave}
      />
    </div>
  );
}
