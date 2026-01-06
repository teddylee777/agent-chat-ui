"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolTypeBadge } from "./tool-type-badge";
import { cn } from "@/lib/utils";
import type { ToolSummary } from "@/lib/types/agent-builder";

// Filter options
const filterOptions = [
  { value: null, label: "All" },
  { value: "built-in", label: "built-in" },
  { value: "custom", label: "custom" },
  { value: "mcp", label: "mcp" },
] as const;

interface ToolListProps {
  tools: ToolSummary[];
  selectedTool: string | null;
  onSelectTool: (toolName: string) => void;
  isLoading?: boolean;
}

export function ToolList({
  tools,
  selectedTool,
  onSelectTool,
  isLoading,
}: ToolListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredTools = useMemo(() => {
    let result = tools;

    // Type filter
    if (typeFilter === "mcp") {
      result = result.filter(
        (t) => t.tool_type === "mcp-stdio" || t.tool_type === "mcp-http"
      );
    } else if (typeFilter) {
      result = result.filter((t) => t.tool_type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.tool_name.toLowerCase().includes(query) ||
          t.tool_description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tools, typeFilter, searchQuery]);

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
            placeholder="Search tools..."
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
              variant={typeFilter === option.value ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setTypeFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-auto p-2">
        {filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-sm">No tools found</p>
            {searchQuery && (
              <p className="text-xs">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTools.map((tool) => (
              <button
                key={tool.tool_name}
                onClick={() => onSelectTool(tool.tool_name)}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-colors",
                  selectedTool === tool.tool_name
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {tool.tool_name}
                  </span>
                  <ToolTypeBadge type={tool.tool_type} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {tool.tool_description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
