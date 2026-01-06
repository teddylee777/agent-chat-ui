import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useThreads } from "@/hooks/useThreads";
import * as api from "@/lib/api/agent-builder";
import type { Thread, ThreadListResponse } from "@/lib/types/agent-builder";

vi.mock("@/lib/api/agent-builder");

describe("useThreads", () => {
  const mockThreads: Thread[] = [
    {
      thread_id: "thread-1",
      agent_id: "agent-1",
      status: "idle",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T12:00:00Z",
      metadata: { first_message: "Hello" },
      message_count: 5,
    },
    {
      thread_id: "thread-2",
      agent_id: "agent-1",
      status: "idle",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T12:00:00Z",
      metadata: { first_message: "Another chat" },
      message_count: 3,
    },
  ];

  const mockResponse: ThreadListResponse = {
    threads: mockThreads,
    total: 2,
    offset: 0,
    limit: 20,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getThreads).mockResolvedValue(mockResponse);
  });

  it("should fetch threads on mount", async () => {
    const { result } = renderHook(() => useThreads("agent-1"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.threads).toHaveLength(2);
    expect(api.getThreads).toHaveBeenCalledWith("agent-1", {
      limit: 20,
      offset: 0,
    });
  });

  it("should return empty array when agentId is not provided", async () => {
    const { result } = renderHook(() => useThreads(""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.threads).toEqual([]);
    expect(api.getThreads).not.toHaveBeenCalled();
  });

  it("should handle error state", async () => {
    vi.mocked(api.getThreads).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.threads).toEqual([]);
  });

  it("should refetch threads when called", async () => {
    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getThreads).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(api.getThreads).toHaveBeenCalledTimes(2);
  });

  it("should select a thread", async () => {
    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.selectedThreadId).toBeNull();

    act(() => {
      result.current.selectThread("thread-1");
    });

    expect(result.current.selectedThreadId).toBe("thread-1");
  });

  it("should deselect a thread when null is passed", async () => {
    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Select first
    act(() => {
      result.current.selectThread("thread-1");
    });
    expect(result.current.selectedThreadId).toBe("thread-1");

    // Deselect
    act(() => {
      result.current.selectThread(null);
    });
    expect(result.current.selectedThreadId).toBeNull();
  });

  it("should delete a thread and refresh list", async () => {
    vi.mocked(api.deleteThread).mockResolvedValue({
      success: true,
      message: "Deleted",
    });

    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getThreads).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.deleteThread("thread-1");
    });

    expect(api.deleteThread).toHaveBeenCalledWith("agent-1", "thread-1");
    expect(api.getThreads).toHaveBeenCalledTimes(2); // initial + after delete
  });

  it("should deselect if deleted thread was selected", async () => {
    vi.mocked(api.deleteThread).mockResolvedValue({
      success: true,
      message: "Deleted",
    });

    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Select the thread first
    act(() => {
      result.current.selectThread("thread-1");
    });
    expect(result.current.selectedThreadId).toBe("thread-1");

    // Delete the selected thread
    await act(async () => {
      await result.current.deleteThread("thread-1");
    });

    // Should be deselected
    expect(result.current.selectedThreadId).toBeNull();
  });

  it("should not deselect if different thread was deleted", async () => {
    vi.mocked(api.deleteThread).mockResolvedValue({
      success: true,
      message: "Deleted",
    });

    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Select thread-1
    act(() => {
      result.current.selectThread("thread-1");
    });

    // Delete thread-2
    await act(async () => {
      await result.current.deleteThread("thread-2");
    });

    // thread-1 should still be selected
    expect(result.current.selectedThreadId).toBe("thread-1");
  });

  it("should throw error when delete fails", async () => {
    vi.mocked(api.deleteThread).mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useThreads("agent-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.deleteThread("thread-1");
      })
    ).rejects.toThrow("Delete failed");
  });

  it("should accept custom pagination options", async () => {
    const { result } = renderHook(() =>
      useThreads("agent-1", { limit: 10, offset: 5 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getThreads).toHaveBeenCalledWith("agent-1", {
      limit: 10,
      offset: 5,
    });
  });

  it("should refetch when agentId changes", async () => {
    const { result, rerender } = renderHook(
      ({ agentId }) => useThreads(agentId),
      { initialProps: { agentId: "agent-1" } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getThreads).toHaveBeenCalledWith("agent-1", expect.any(Object));

    // Change agentId
    rerender({ agentId: "agent-2" });

    await waitFor(() => {
      expect(api.getThreads).toHaveBeenCalledWith(
        "agent-2",
        expect.any(Object)
      );
    });
  });
});
