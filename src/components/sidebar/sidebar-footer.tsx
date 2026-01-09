"use client";

import { Key, Wrench, Cpu, Settings } from "lucide-react";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "border-t border-gray-200 p-4 dark:border-gray-700",
        collapsed
          ? "flex flex-col items-center gap-2"
          : "flex items-center justify-around"
      )}
    >
      <TooltipIconButton
        tooltip="Secrets"
        variant="ghost"
        className="size-9 p-2"
        onClick={() => router.push("/secrets")}
      >
        <Key className="size-5 text-gray-600 dark:text-gray-400" />
      </TooltipIconButton>

      <TooltipIconButton
        tooltip="Tools"
        variant="ghost"
        className="size-9 p-2"
        onClick={() => router.push("/tools")}
      >
        <Wrench className="size-5 text-gray-600 dark:text-gray-400" />
      </TooltipIconButton>

      <TooltipIconButton
        tooltip="Models"
        variant="ghost"
        className="size-9 p-2"
        onClick={() => router.push("/models")}
      >
        <Cpu className="size-5 text-gray-600 dark:text-gray-400" />
      </TooltipIconButton>

      <TooltipIconButton
        tooltip="Settings"
        variant="ghost"
        className="size-9 p-2"
        onClick={() => router.push("/settings")}
      >
        <Settings className="size-5 text-gray-600 dark:text-gray-400" />
      </TooltipIconButton>
    </div>
  );
}
