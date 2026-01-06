"use client";

import { Cpu } from "lucide-react";
import { useAgentCreate } from "@/providers/AgentCreate";
import { CreateModelSettingsDialog } from "./create-model-settings-dialog";

export function CreateModelSettings() {
  const { config } = useAgentCreate();

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
        <p className="truncate text-sm text-gray-500 dark:text-gray-400 font-mono">
          {config.model_name || "Not configured"}
        </p>
      </div>

      {/* Right: Settings Button */}
      <CreateModelSettingsDialog />
    </div>
  );
}
