"use client";

import { cn } from "@/lib/utils";
import type { ToolType } from "@/lib/types/agent-builder";

// Display labels (frontend only)
const typeLabels: Record<ToolType, string> = {
  "built-in": "built-in",
  custom: "custom",
  "mcp-stdio": "mcp(local)",
  "mcp-http": "mcp(remote)",
};

// Styles (shadcn/ui style - Black/White/Grey)
const typeStyles: Record<ToolType, string> = {
  "built-in": "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
  custom: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
  "mcp-stdio":
    "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
  "mcp-http":
    "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
};

interface ToolTypeBadgeProps {
  type: ToolType;
  className?: string;
}

export function ToolTypeBadge({ type, className }: ToolTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium",
        typeStyles[type] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        className
      )}
    >
      {typeLabels[type] || type}
    </span>
  );
}
