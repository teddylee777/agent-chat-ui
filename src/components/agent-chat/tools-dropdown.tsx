"use client";

import { useState } from "react";
import { Wrench, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAgentTools } from "@/lib/api/agent-builder";
import type { AgentToolEntry } from "@/lib/types/agent-builder";

interface ToolsDropdownProps {
  agentId: string;
}

export function ToolsDropdown({ agentId }: ToolsDropdownProps) {
  const [tools, setTools] = useState<AgentToolEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (open && tools.length === 0) {
      setIsLoading(true);
      try {
        const response = await getAgentTools(agentId);
        setTools(response.tools);
      } catch (error) {
        console.error("Failed to fetch tools:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wrench className="size-4" />
          Tools
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isLoading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : tools.length === 0 ? (
          <DropdownMenuItem disabled>No tools configured</DropdownMenuItem>
        ) : (
          tools.map((tool) => (
            <DropdownMenuItem key={tool.tool_name} disabled>
              {tool.tool_name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
