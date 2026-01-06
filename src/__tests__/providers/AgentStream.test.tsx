import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
  AgentStreamProvider,
  useAgentStreamContext,
} from "@/providers/AgentStream";
import * as api from "@/lib/api/agent-builder";
import type { ThreadHistory } from "@/lib/types/agent-builder";

vi.mock("@/lib/api/agent-builder");

// Test consumer component to access context
function TestConsumer() {
  const ctx = useAgentStreamContext();
  return (
    <div>
      <span data-testid="thread-id">{ctx.threadId || "null"}</span>
      <span data-testid="message-count">{ctx.messages.length}</span>
      <span data-testid="is-loading">{String(ctx.isLoading)}</span>
      <button onClick={() => ctx.loadThread?.("thread-123")}>Load Thread</button>
      <button onClick={() => ctx.clearThread?.()}>Clear Thread</button>
    </div>
  );
}

describe("AgentStreamProvider - Thread Loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should expose loadThread function", () => {
    render(
      <AgentStreamProvider agentId="agent-1">
        <TestConsumer />
      </AgentStreamProvider>
    );

    expect(
      screen.getByRole("button", { name: /load thread/i })
    ).toBeInTheDocument();
  });

  it("should expose clearThread function", () => {
    render(
      <AgentStreamProvider agentId="agent-1">
        <TestConsumer />
      </AgentStreamProvider>
    );

    expect(
      screen.getByRole("button", { name: /clear thread/i })
    ).toBeInTheDocument();
  });

  it("should load thread history when loadThread is called", async () => {
    const mockHistory: ThreadHistory = {
      thread_id: "thread-123",
      agent_id: "agent-1",
      messages: [
        { id: "msg-1", type: "human", content: "Hello" },
        { id: "msg-2", type: "ai", content: "Hi there!" },
      ],
      total: 2,
    };

    vi.mocked(api.getThreadHistory).mockResolvedValue(mockHistory);

    render(
      <AgentStreamProvider agentId="agent-1">
        <TestConsumer />
      </AgentStreamProvider>
    );

    // Initial state
    expect(screen.getByTestId("thread-id")).toHaveTextContent("null");
    expect(screen.getByTestId("message-count")).toHaveTextContent("0");

    // Load thread
    await act(async () => {
      screen.getByRole("button", { name: /load thread/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("thread-id")).toHaveTextContent("thread-123");
      expect(screen.getByTestId("message-count")).toHaveTextContent("2");
    });

    expect(api.getThreadHistory).toHaveBeenCalledWith("agent-1", "thread-123");
  });

  it("should clear messages when clearThread is called", async () => {
    const mockHistory: ThreadHistory = {
      thread_id: "thread-123",
      agent_id: "agent-1",
      messages: [{ id: "msg-1", type: "human", content: "Hello" }],
      total: 1,
    };

    vi.mocked(api.getThreadHistory).mockResolvedValue(mockHistory);

    render(
      <AgentStreamProvider agentId="agent-1">
        <TestConsumer />
      </AgentStreamProvider>
    );

    // Load thread first
    await act(async () => {
      screen.getByRole("button", { name: /load thread/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("message-count")).toHaveTextContent("1");
    });

    // Clear thread
    await act(async () => {
      screen.getByRole("button", { name: /clear thread/i }).click();
    });

    expect(screen.getByTestId("thread-id")).toHaveTextContent("null");
    expect(screen.getByTestId("message-count")).toHaveTextContent("0");
  });

  it("should handle loadThread error gracefully", async () => {
    vi.mocked(api.getThreadHistory).mockRejectedValue(
      new Error("Network error")
    );

    render(
      <AgentStreamProvider agentId="agent-1">
        <TestConsumer />
      </AgentStreamProvider>
    );

    await act(async () => {
      screen.getByRole("button", { name: /load thread/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
    });

    // Should not crash, threadId should remain null
    expect(screen.getByTestId("thread-id")).toHaveTextContent("null");
    expect(screen.getByTestId("message-count")).toHaveTextContent("0");
  });

  it("should set isLoading to true while loading thread", async () => {
    const mockHistory: ThreadHistory = {
      thread_id: "thread-123",
      agent_id: "agent-1",
      messages: [],
      total: 0,
    };

    // Delay the response to see loading state
    vi.mocked(api.getThreadHistory).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockHistory), 100))
    );

    render(
      <AgentStreamProvider agentId="agent-1">
        <TestConsumer />
      </AgentStreamProvider>
    );

    await act(async () => {
      screen.getByRole("button", { name: /load thread/i }).click();
    });

    // Should be loading
    expect(screen.getByTestId("is-loading")).toHaveTextContent("true");

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
    });
  });
});
