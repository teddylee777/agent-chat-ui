"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAgents } from "@/providers/Agent";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

interface CreateAgentButtonProps {
  collapsed?: boolean;
}

export function CreateAgentButton({ collapsed }: CreateAgentButtonProps) {
  const pathname = usePathname();
  const { setSelectedAgent } = useAgents();
  const isActive = pathname === "/";

  const handleClick = () => {
    setSelectedAgent(null);
  };

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <Link href="/" onClick={handleClick}>
          <TooltipIconButton
            tooltip="Create New Agent"
            variant="ghost"
            className={cn(
              "size-10 p-2",
              isActive && "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <PlusCircle className="size-5 text-gray-600 dark:text-gray-400" />
          </TooltipIconButton>
        </Link>
      </div>
    );
  }

  return (
    <Link href="/" onClick={handleClick}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50",
          isActive && "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <PlusCircle className="size-4" />
        <span className="text-sm font-medium">Create New Agent</span>
      </Button>
    </Link>
  );
}
