"use client";

import { Key, Wrench, Settings } from "lucide-react";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { useRouter } from "next/navigation";

export function SidebarFooter() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-around border-t border-gray-200 p-4 dark:border-gray-700">
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
