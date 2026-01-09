"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebarState } from "@/hooks/useSidebarState";
import { CreateAgentButton } from "./create-agent-button";
import { TemplatesButton } from "./templates-button";
import { AgentList } from "./agent-list";
import { SidebarFooter } from "./sidebar-footer";
import { UserProfile } from "./user-profile";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useSidebarState();

  const collapsed = !sidebarOpen;

  // On desktop (lg+), render the full sidebar content
  // On mobile, render only the Sheet component
  if (isLargeScreen) {
    return (
      <div
        className={cn(
          "flex h-screen shrink-0 flex-col bg-white dark:bg-gray-900",
          collapsed ? "w-16" : "w-[280px]"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center py-3",
            collapsed ? "justify-center px-2" : "gap-2 px-4"
          )}
        >
          <Button
            className="hover:bg-gray-50 dark:hover:bg-gray-800"
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((p) => !p)}
          >
            {sidebarOpen ? (
              <PanelRightOpen className="size-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <PanelRightClose className="size-5 text-gray-600 dark:text-gray-400" />
            )}
          </Button>
          {!collapsed && (
            <span className="flex-1 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Deep Agent Builder
            </span>
          )}
        </div>

        {/* Create Agent & Templates Buttons */}
        <div className={cn("py-1", collapsed ? "px-1" : "px-2")}>
          <CreateAgentButton collapsed={collapsed} />
          <TemplatesButton collapsed={collapsed} />
        </div>

        {/* Agent List */}
        <AgentList collapsed={collapsed} />

        {/* Footer */}
        <SidebarFooter collapsed={collapsed} />

        {/* User Profile */}
        <UserProfile collapsed={collapsed} />
      </div>
    );
  }

  // Mobile: render Sheet overlay
  return (
    <Sheet open={!!sidebarOpen} onOpenChange={(open) => setSidebarOpen(open)}>
      <SheetContent side="left" className="flex w-[280px] flex-col p-0">
        <SheetHeader className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <SheetTitle className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Deep Agent Builder
          </SheetTitle>
        </SheetHeader>

        {/* Create Agent & Templates Buttons */}
        <div className="px-2 py-1">
          <CreateAgentButton />
          <TemplatesButton />
        </div>

        {/* Agent List */}
        <AgentList />

        {/* Footer */}
        <SidebarFooter />

        {/* User Profile */}
        <UserProfile />
      </SheetContent>
    </Sheet>
  );
}
