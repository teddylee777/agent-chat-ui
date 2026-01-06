import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThreadItem } from "@/components/thread/thread-sidebar/ThreadItem";
import type { Thread } from "@/lib/types/agent-builder";

const mockThread: Thread = {
  thread_id: "thread-1",
  agent_id: "agent-1",
  status: "idle",
  created_at: "2024-01-15T00:00:00Z",
  updated_at: "2024-01-15T12:00:00Z",
  metadata: { first_message: "Hello, how are you doing today?" },
  message_count: 5,
};

describe("ThreadItem", () => {
  it("should render thread preview text", () => {
    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText(/Hello, how are you/)).toBeInTheDocument();
  });

  it("should truncate long preview text", () => {
    const longThread: Thread = {
      ...mockThread,
      metadata: {
        first_message:
          "This is a very long message that should be truncated because it exceeds the maximum allowed characters for preview display",
      },
    };

    render(
      <ThreadItem
        thread={longThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    // Should not display full text
    expect(
      screen.queryByText(
        "This is a very long message that should be truncated because it exceeds the maximum allowed characters for preview display"
      )
    ).not.toBeInTheDocument();
  });

  it("should display default text when no first_message", () => {
    const noMessageThread: Thread = {
      ...mockThread,
      metadata: {},
    };

    render(
      <ThreadItem
        thread={noMessageThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText(/New conversation/)).toBeInTheDocument();
  });

  it("should display formatted date", () => {
    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    // Should display date in some format (checking for month/day pattern)
    expect(screen.getByText(/01\/15\/2024|Jan 15/)).toBeInTheDocument();
  });

  it("should display message count", () => {
    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const mockClick = vi.fn();

    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={mockClick}
        onDelete={() => {}}
      />
    );

    fireEvent.click(screen.getByRole("button"));

    expect(mockClick).toHaveBeenCalled();
  });

  it("should show delete button on hover", () => {
    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    const item = screen.getByRole("button");
    fireEvent.mouseEnter(item);

    expect(screen.getByLabelText(/delete/i)).toBeInTheDocument();
  });

  it("should call onDelete when delete button clicked", () => {
    const mockDelete = vi.fn();

    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={mockDelete}
      />
    );

    const item = screen.getByRole("button");
    fireEvent.mouseEnter(item);
    fireEvent.click(screen.getByLabelText(/delete/i));

    expect(mockDelete).toHaveBeenCalledWith("thread-1");
  });

  it("should prevent click propagation when deleting", () => {
    const mockClick = vi.fn();
    const mockDelete = vi.fn();

    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={mockClick}
        onDelete={mockDelete}
      />
    );

    const item = screen.getByRole("button");
    fireEvent.mouseEnter(item);
    fireEvent.click(screen.getByLabelText(/delete/i));

    expect(mockDelete).toHaveBeenCalled();
    expect(mockClick).not.toHaveBeenCalled();
  });

  it("should apply selected styles when isSelected is true", () => {
    render(
      <ThreadItem
        thread={mockThread}
        isSelected={true}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    const item = screen.getByRole("button");
    expect(item).toHaveAttribute("data-selected", "true");
  });

  it("should not have selected attribute when not selected", () => {
    render(
      <ThreadItem
        thread={mockThread}
        isSelected={false}
        onClick={() => {}}
        onDelete={() => {}}
      />
    );

    const item = screen.getByRole("button");
    expect(item).toHaveAttribute("data-selected", "false");
  });
});
