"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModelProviderBadge } from "./model-provider-badge";
import { cn } from "@/lib/utils";
import type { ModelDefinitionSummary, ModelProvider } from "@/lib/types/agent-builder";

// Filter options
const filterOptions: { value: ModelProvider | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "anthropic", label: "anthropic" },
  { value: "openai", label: "openai" },
  { value: "google", label: "google" },
  { value: "azure", label: "azure" },
  { value: "bedrock", label: "bedrock" },
  { value: "custom", label: "custom" },
];

interface ModelListProps {
  models: ModelDefinitionSummary[];
  selectedModel: string | null;
  onSelectModel: (modelId: string) => void;
  isLoading?: boolean;
}

export function ModelList({
  models,
  selectedModel,
  onSelectModel,
  isLoading,
}: ModelListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<ModelProvider | null>(null);

  const filteredModels = useMemo(() => {
    let result = models;

    // Provider filter
    if (providerFilter) {
      result = result.filter((m) => m.provider === providerFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.model_name.toLowerCase().includes(query) ||
          m.model_description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [models, providerFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex-1 space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Filter Buttons */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {filterOptions.map((option) => (
            <Button
              key={option.label}
              variant={providerFilter === option.value ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setProviderFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Model List */}
      <div className="flex-1 overflow-auto p-2">
        {filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-sm">No models found</p>
            {searchQuery && (
              <p className="text-xs">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredModels.map((model) => (
              <button
                key={model.model_id}
                onClick={() => onSelectModel(model.model_id)}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-colors",
                  selectedModel === model.model_id
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm">
                    {model.model_name}
                  </span>
                  <ModelProviderBadge provider={model.provider} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {model.model_description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
