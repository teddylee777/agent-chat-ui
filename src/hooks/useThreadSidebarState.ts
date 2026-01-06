"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "lg:thread-sidebar:open";

function getStoredState(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "true";
}

export function useThreadSidebarState(): [
  boolean,
  (value: boolean | ((prev: boolean) => boolean)) => void
] {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsOpen(getStoredState());
    setMounted(true);
  }, []);

  const setIsOpenWithPersist = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsOpen((prev) => {
        const newValue = typeof value === "function" ? value(prev) : value;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, String(newValue));
        }
        return newValue;
      });
    },
    []
  );

  return [mounted ? isOpen : false, setIsOpenWithPersist];
}
