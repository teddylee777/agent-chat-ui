"use client";

import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

interface TemplatesButtonProps {
  collapsed?: boolean;
}

export function TemplatesButton({ collapsed }: TemplatesButtonProps) {
  const handleClick = () => {
    // Placeholder - no functionality yet
  };

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <TooltipIconButton
          tooltip="Templates"
          variant="ghost"
          className="size-10 p-2"
          onClick={handleClick}
        >
          <LayoutGrid className="size-5 text-gray-600 dark:text-gray-400" />
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50"
      onClick={handleClick}
    >
      <LayoutGrid className="size-4" />
      <span className="text-sm font-medium">Templates</span>
    </Button>
  );
}
