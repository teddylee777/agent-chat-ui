"use client";

import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebarState } from "@/hooks/useSidebarState";
import Sidebar from "@/components/sidebar";

const SIDEBAR_EXPANDED_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 64;

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen] = useSidebarState();

  const sidebarWidth = sidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar />
      </div>

      {/* Desktop Sidebar - Width animation */}
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r bg-white dark:bg-gray-900 dark:border-gray-700"
          initial={false}
          animate={{ width: sidebarWidth }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Sidebar />
        </motion.div>
      </div>

      {/* Main Content - CSS transition */}
      <div
        className="relative flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ease-out"
        style={{
          marginLeft: isLargeScreen === true ? sidebarWidth : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
