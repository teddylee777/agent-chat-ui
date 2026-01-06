"use client";

import React from "react";
import { Toaster } from "sonner";
import { AgentProvider } from "@/providers/Agent";
import { BackgroundRunManager } from "@/providers/BackgroundRunManager";
import { MainLayout } from "@/components/layout/main-layout";

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Toaster />
      <BackgroundRunManager>
        <AgentProvider>
          <MainLayout>{children}</MainLayout>
        </AgentProvider>
      </BackgroundRunManager>
    </React.Suspense>
  );
}
