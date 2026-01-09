"use client";

import { cn } from "@/lib/utils";
import type { ModelProvider } from "@/lib/types/agent-builder";

// Display labels
const providerLabels: Record<ModelProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  azure: "Azure",
  bedrock: "Bedrock",
  custom: "Custom",
};

// Styles for each provider
const providerStyles: Record<ModelProvider, string> = {
  anthropic: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  openai: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  google: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  azure: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  bedrock: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  custom: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

interface ModelProviderBadgeProps {
  provider: ModelProvider;
  className?: string;
}

export function ModelProviderBadge({ provider, className }: ModelProviderBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium",
        providerStyles[provider] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        className
      )}
    >
      {providerLabels[provider] || provider}
    </span>
  );
}
