import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThreadSidebarState } from "@/hooks/useThreadSidebarState";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("useThreadSidebarState", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should return default closed state (false)", () => {
    const { result } = renderHook(() => useThreadSidebarState());

    expect(result.current[0]).toBe(false);
  });

  it("should toggle sidebar state to true", () => {
    const { result } = renderHook(() => useThreadSidebarState());

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
  });

  it("should toggle sidebar state to false", () => {
    const { result } = renderHook(() => useThreadSidebarState());

    // Open first
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);

    // Then close
    act(() => {
      result.current[1](false);
    });
    expect(result.current[0]).toBe(false);
  });

  it("should support function updater", () => {
    const { result } = renderHook(() => useThreadSidebarState());

    // Toggle using function
    act(() => {
      result.current[1]((prev) => !prev);
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1]((prev) => !prev);
    });
    expect(result.current[0]).toBe(false);
  });

  it("should persist state to localStorage", () => {
    const { result } = renderHook(() => useThreadSidebarState());

    act(() => {
      result.current[1](true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "lg:thread-sidebar:open",
      "true"
    );
  });

  it("should read initial state from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("true");

    const { result } = renderHook(() => useThreadSidebarState());

    // After mount effect runs
    expect(result.current[0]).toBe(true);
  });

  it("should handle false value from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("false");

    const { result } = renderHook(() => useThreadSidebarState());

    expect(result.current[0]).toBe(false);
  });

  it("should handle invalid localStorage value", () => {
    localStorageMock.getItem.mockReturnValue("invalid");

    const { result } = renderHook(() => useThreadSidebarState());

    // Should default to false for invalid values
    expect(result.current[0]).toBe(false);
  });
});
