import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThreadSidebar } from "@/components/thread/thread-sidebar/ThreadSidebar";
import * as useThreadsHook from "@/hooks/useThreads";
import type { Thread } from "@/lib/types/agent-builder";

// Mock the hook
vi.mock("@/hooks/useThreads");

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    aside: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockThreads: Thread[] = [
  {
    thread_id: "thread-1",
    agent_id: "agent-1",
    status: "idle",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T12:00:00Z",
    metadata: { first_message: "Hello, how are you?" },
    message_count: 5,
  },
  {
    thread_id: "thread-2",
    agent_id: "agent-1",
    status: "idle",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T12:00:00Z",
    metadata: { first_message: "Another conversation" },
    message_count: 3,
  },
];

describe("ThreadSidebar", () => {
  const mockSelectThread = vi.fn();
  const mockDeleteThread = vi.fn();
  const mockRefetch = vi.fn();
  const mockOnToggle = vi.fn();
  const mockOnNewThread = vi.fn();
  const mockOnSelectThread = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useThreadsHook.useThreads).mockReturnValue({
      threads: mockThreads,
      isLoading: false,
      error: null,
      selectedThreadId: null,
      selectThread: mockSelectThread,
      deleteThread: mockDeleteThread,
      refetch: mockRefetch,
    });
  });

  it("should render thread list when open", () => {
    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    expect(screen.getByText("Threads")).toBeInTheDocument();
    expect(screen.getByText(/Hello, how are you/)).toBeInTheDocument();
    expect(screen.getByText(/Another conversation/)).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={false}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    expect(screen.queryByText("Threads")).not.toBeInTheDocument();
  });

  it("should display loading state", () => {
    vi.mocked(useThreadsHook.useThreads).mockReturnValue({
      threads: [],
      isLoading: true,
      error: null,
      selectedThreadId: null,
      selectThread: mockSelectThread,
      deleteThread: mockDeleteThread,
      refetch: mockRefetch,
    });

    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    // Should show skeleton loaders
    expect(screen.getAllByRole("status")).toHaveLength(3);
  });

  it("should display error state with retry button", () => {
    vi.mocked(useThreadsHook.useThreads).mockReturnValue({
      threads: [],
      isLoading: false,
      error: "Failed to load threads",
      selectedThreadId: null,
      selectThread: mockSelectThread,
      deleteThread: mockDeleteThread,
      refetch: mockRefetch,
    });

    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    expect(screen.getByText("Failed to load threads")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("should call refetch when retry button clicked", () => {
    vi.mocked(useThreadsHook.useThreads).mockReturnValue({
      threads: [],
      isLoading: false,
      error: "Failed to load threads",
      selectedThreadId: null,
      selectThread: mockSelectThread,
      deleteThread: mockDeleteThread,
      refetch: mockRefetch,
    });

    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should display empty state when no threads", () => {
    vi.mocked(useThreadsHook.useThreads).mockReturnValue({
      threads: [],
      isLoading: false,
      error: null,
      selectedThreadId: null,
      selectThread: mockSelectThread,
      deleteThread: mockDeleteThread,
      refetch: mockRefetch,
    });

    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    expect(screen.getByText(/no threads yet/i)).toBeInTheDocument();
  });

  it("should call onSelectThread when clicking a thread", () => {
    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    fireEvent.click(screen.getByText(/Hello, how are you/));

    expect(mockSelectThread).toHaveBeenCalledWith("thread-1");
    expect(mockOnSelectThread).toHaveBeenCalledWith("thread-1");
  });

  it("should call onNewThread when clicking new thread button", () => {
    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /new thread/i }));

    expect(mockSelectThread).toHaveBeenCalledWith(null);
    expect(mockOnNewThread).toHaveBeenCalled();
  });

  it("should call onToggle when close button clicked", () => {
    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    // Find and click the close button (X icon)
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalled();
  });

  it("should highlight selected thread", () => {
    vi.mocked(useThreadsHook.useThreads).mockReturnValue({
      threads: mockThreads,
      isLoading: false,
      error: null,
      selectedThreadId: "thread-1",
      selectThread: mockSelectThread,
      deleteThread: mockDeleteThread,
      refetch: mockRefetch,
    });

    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
        selectedThreadId="thread-1"
      />
    );

    const threadItem = screen.getByText(/Hello, how are you/).closest("[data-selected]");
    expect(threadItem).toHaveAttribute("data-selected", "true");
  });

  it("should have 280px width", () => {
    render(
      <ThreadSidebar
        agentId="agent-1"
        isOpen={true}
        onToggle={mockOnToggle}
        onNewThread={mockOnNewThread}
        onSelectThread={mockOnSelectThread}
      />
    );

    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toHaveStyle({ width: "280px" });
  });
});
