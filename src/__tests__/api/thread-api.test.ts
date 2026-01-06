import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getThreads,
  getThread,
  createThread,
  deleteThread,
  getThreadHistory,
} from "@/lib/api/agent-builder";
import type {
  Thread,
  ThreadListResponse,
  ThreadHistory,
} from "@/lib/types/agent-builder";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Thread API Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockThread: Thread = {
    thread_id: "thread-123",
    agent_id: "agent-1",
    status: "idle",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T12:00:00Z",
    metadata: { first_message: "Hello, how are you?" },
    message_count: 5,
  };

  describe("getThreads", () => {
    it("should fetch threads for an agent with default pagination", async () => {
      const mockResponse: ThreadListResponse = {
        threads: [mockThread],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getThreads("agent-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/agents/agent-1/threads?limit=20&offset=0",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch threads with custom pagination", async () => {
      const mockResponse: ThreadListResponse = {
        threads: [],
        total: 0,
        offset: 10,
        limit: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getThreads("agent-1", { limit: 5, offset: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/agents/agent-1/threads?limit=5&offset=10",
        expect.any(Object)
      );
    });

    it("should throw error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Agent not found" }),
      });

      await expect(getThreads("invalid-agent")).rejects.toThrow(
        "Agent not found"
      );
    });

    it("should handle empty threads list", async () => {
      const mockResponse: ThreadListResponse = {
        threads: [],
        total: 0,
        offset: 0,
        limit: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getThreads("agent-1");

      expect(result.threads).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getThread", () => {
    it("should fetch a single thread by ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockThread),
      });

      const result = await getThread("agent-1", "thread-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/agents/agent-1/threads/thread-123",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockThread);
    });

    it("should throw error when thread not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Thread not found" }),
      });

      await expect(getThread("agent-1", "invalid-thread")).rejects.toThrow(
        "Thread not found"
      );
    });
  });

  describe("createThread", () => {
    it("should create a new thread without custom ID", async () => {
      const newThread: Thread = {
        ...mockThread,
        thread_id: "new-thread-id",
        message_count: 0,
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newThread),
      });

      const result = await createThread("agent-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/agents/agent-1/threads",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      expect(result).toEqual(newThread);
    });

    it("should create a thread with custom metadata", async () => {
      const newThread: Thread = {
        ...mockThread,
        thread_id: "custom-thread",
        metadata: { title: "My Thread" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newThread),
      });

      const result = await createThread("agent-1", {
        metadata: { title: "My Thread" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/agents/agent-1/threads",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ metadata: { title: "My Thread" } }),
        })
      );
      expect(result.metadata.title).toBe("My Thread");
    });
  });

  describe("deleteThread", () => {
    it("should delete a thread successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, message: "Thread deleted" }),
      });

      const result = await deleteThread("agent-1", "thread-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/agents/agent-1/threads/thread-123",
        expect.objectContaining({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result.success).toBe(true);
    });

    it("should throw error when thread not found for deletion", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Thread not found" }),
      });

      await expect(deleteThread("agent-1", "invalid-thread")).rejects.toThrow(
        "Thread not found"
      );
    });
  });

  describe("getThreadHistory", () => {
    it("should fetch thread message history", async () => {
      const mockHistory: ThreadHistory = {
        thread_id: "thread-123",
        agent_id: "agent-1",
        messages: [
          { id: "msg-1", type: "human", content: "Hello" },
          { id: "msg-2", type: "ai", content: "Hi there! How can I help you?" },
        ],
        total: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      });

      const result = await getThreadHistory("agent-1", "thread-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/agents/agent-1/threads/thread-123/history",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockHistory);
      expect(result.messages).toHaveLength(2);
    });

    it("should return empty messages for new thread", async () => {
      const mockHistory: ThreadHistory = {
        thread_id: "thread-123",
        agent_id: "agent-1",
        messages: [],
        total: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      });

      const result = await getThreadHistory("agent-1", "thread-123");

      expect(result.messages).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should handle complex message content", async () => {
      const mockHistory: ThreadHistory = {
        thread_id: "thread-123",
        agent_id: "agent-1",
        messages: [
          { id: "msg-1", type: "human", content: "Hello" },
          {
            id: "msg-2",
            type: "ai",
            content: [{ type: "text", text: "Hello!" }],
            tool_calls: [
              { id: "tc-1", name: "search", args: { query: "test" } },
            ],
          },
        ],
        total: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      });

      const result = await getThreadHistory("agent-1", "thread-123");

      expect(result.messages[1].tool_calls).toBeDefined();
      expect(result.messages[1].tool_calls?.[0].name).toBe("search");
    });

    it("should throw error when thread not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Thread not found" }),
      });

      await expect(
        getThreadHistory("agent-1", "invalid-thread")
      ).rejects.toThrow("Thread not found");
    });
  });
});
