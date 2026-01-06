"use client";

import { useEffect, useRef, useMemo, useState, FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AgentStreamProvider,
  useAgentStreamContext,
} from "@/providers/AgentStream";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import {
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  Bot,
  Pencil,
  History,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useThreadSidebarState } from "@/hooks/useThreadSidebarState";
import { useBackgroundRun } from "@/hooks/useBackgroundRun";
import { useThreadBackgroundStatus } from "@/hooks/useThreadBackgroundStatus";
import { MarkdownText } from "./markdown-text";
import { ThreadSidebar } from "./thread-sidebar";
import { ToolsDropdown } from "@/components/agent-chat/tools-dropdown";
import { getContentString } from "./utils";
import { ToolCallDisplay, ToolResultDisplay, parseToolCalls, type ToolCall, type ToolResult } from "./tool-call-display";
import { toast } from "sonner";
import type { Message } from "@langchain/langgraph-sdk";
import type { AgentSummary } from "@/lib/types/agent-builder";

// Simplified message components for agent-builder (no branching/regeneration)
function AgentHumanMessage({ message }: { message: Message }) {
  const contentString = getContentString(message.content);
  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="flex flex-col gap-2">
        <p className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap">
          {contentString}
        </p>
      </div>
    </div>
  );
}

function AgentAssistantMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const content = message?.content ?? [];
  const contentString = getContentString(content);

  // Parse tool calls from content (XML patterns - legacy support)
  const { toolCalls: parsedToolCalls, cleanContent } = parseToolCalls(contentString);

  // Get tool calls from message.tool_calls (from tool_call events)
  const messageToolCalls = (message as any).tool_calls || [];
  const structuredToolCalls: ToolCall[] = messageToolCalls.map((tc: any) => ({
    id: tc.id,
    name: tc.name || "",
    parameters: typeof tc.args === "object" && tc.args !== null
      ? Object.fromEntries(
          Object.entries(tc.args).map(([k, v]) => [k, String(v)])
        )
      : {},
  }));

  // Get tool results from message.tool_results (from tool_result events)
  const messageToolResults: ToolResult[] = (message as any).tool_results || [];

  // tool_results가 있으면 해당 JSON을 cleanContent에서 제거 (history 로드 시 중복 방지)
  let finalContent = cleanContent;
  if (messageToolResults.length > 0) {
    messageToolResults.forEach((result) => {
      if (result.result) {
        finalContent = finalContent.replace(result.result, "").trim();
      }
    });
  }

  // Combine both sources (structured first, then parsed from content)
  const allToolCalls = [...structuredToolCalls, ...parsedToolCalls];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group mr-auto flex w-full flex-col gap-1">
      <div className="flex w-full flex-col gap-2">
        {allToolCalls.length > 0 && <ToolCallDisplay toolCalls={allToolCalls} />}
        {messageToolResults.length > 0 && <ToolResultDisplay results={messageToolResults} />}
        {finalContent.length > 0 && (
          <div className="py-1">
            <MarkdownText>{finalContent}</MarkdownText>
          </div>
        )}
      </div>

      {/* Copy button - 텍스트 아래 우측 정렬 */}
      {finalContent.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Copy"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function AgentAssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-2">
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
      </div>
    </div>
  );
}

function StickyToBottomContent(props: {
  content: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>
      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

interface AgentThreadContentProps {
  agent: AgentSummary;
}

function AgentThreadContent({ agent }: AgentThreadContentProps) {
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [threadSidebarOpen, setThreadSidebarOpen] = useThreadSidebarState();
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [threadRefetchTrigger, setThreadRefetchTrigger] = useState(0);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useAgentStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  // Background status management
  const { setStatus, getStatus, markViewed, updateStatus, clearStatus } = useThreadBackgroundStatus(agent.agent_id);

  // Background run polling
  const { startPolling, stopPolling, isPolling } = useBackgroundRun(
    agent.agent_id,
    stream.threadId,
    {
      onComplete: async (run) => {
        // Update status to success
        if (stream.threadId) {
          updateStatus(stream.threadId, "success");

          // Reload thread history to get the response
          try {
            await stream.loadThread(stream.threadId);
          } catch (error) {
            console.error("Failed to load thread history:", error);
          }
          // No toast here - user can see the result directly in chat UI
          // Toast is only shown by global BackgroundRunManager when user is on a different page
        }
        stream.setActiveBackgroundRun(null);
      },
      onError: (run) => {
        // Update status to error
        if (stream.threadId) {
          updateStatus(stream.threadId, "error");
          // No toast here - global BackgroundRunManager handles notifications
        }
        stream.setActiveBackgroundRun(null);
      },
    }
  );

  // Start polling when there's an active background run
  useEffect(() => {
    if (stream.activeBackgroundRun && stream.threadId === stream.activeBackgroundRun.threadId) {
      startPolling(stream.activeBackgroundRun.runId);
    }
    return () => {
      stopPolling();
    };
  }, [stream.activeBackgroundRun, stream.threadId, startPolling, stopPolling]);

  // Check for pending background run when entering a thread
  useEffect(() => {
    if (stream.threadId) {
      const status = getStatus(stream.threadId);
      // Resume polling if status is pending or running (regardless of viewed flag)
      // viewed flag is for UI indicator only, not for polling control
      if (status && (status.status === "pending" || status.status === "running")) {
        startPolling(status.runId);
      }
    }
  }, [stream.threadId, getStatus, startPolling]);

  // Auto-disable background mode when a conversation completes (for streaming mode)
  // Use ref to track if a conversation was ever started, only then disable on completion
  const wasInProgressRef = useRef(false);

  useEffect(() => {
    if (isLoading || isPolling) {
      // Conversation is in progress
      wasInProgressRef.current = true;
    } else if (wasInProgressRef.current) {
      // Conversation just completed (transitioned from in-progress to idle)
      wasInProgressRef.current = false;
      setIsBackgroundMode(false);
      // Refresh thread list to show new/updated thread
      setThreadRefetchTrigger((prev) => prev + 1);
    }
  }, [isLoading, isPolling]);

  const handleSelectThread = async (threadId: string) => {
    await stream.loadThread(threadId);
  };

  const handleNewThread = () => {
    stream.clearThread();
  };

  const lastError = useRef<string | undefined>(undefined);

  // Handle errors
  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        return;
      }
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // Track first token received
  const prevMessageLength = useRef(0);
  // Track Ctrl+Enter for background run
  const forceBackgroundRef = useRef(false);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }
    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (input.trim().length === 0 || isLoading || isPolling) return;
    setFirstTokenReceived(false);

    // Ctrl+Enter로 전송 시 background run 강제
    const shouldUseBackground = isBackgroundMode || forceBackgroundRef.current;
    forceBackgroundRef.current = false; // reset

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    if (shouldUseBackground) {
      // Background mode: use submitBackground
      const response = await stream.submitBackground({ messages: [newHumanMessage] });

      if (response) {
        // Use response.thread_id instead of stream.threadId
        // (stream.threadId may still be null due to async state update)
        setStatus(response.thread_id, {
          runId: response.run_id,
          status: "pending",
          viewed: false,
        });

        // Agent 로고 배경색 업데이트를 위해 이벤트 dispatch
        window.dispatchEvent(new CustomEvent("background-status-update"));

        // Trigger thread list refetch to show new thread immediately
        setThreadRefetchTrigger((prev) => prev + 1);

        // Note: startPolling is handled by the effect that watches activeBackgroundRun
        // It will start polling once stream.threadId updates

        // Show toast
        toast.info("Background run started", {
          description: "Your request is being processed in the background.",
          duration: 3000,
        });
      }
    } else {
      // Normal streaming mode
      const isNewThread = !stream.threadId;
      stream.submit(
        { messages: [newHumanMessage] },
        {
          optimisticValues: (prev) => ({
            ...prev,
            messages: [...(prev.messages ?? []), newHumanMessage],
          }),
        }
      );
      // Trigger thread list refetch for new threads (thread is now created via API first)
      if (isNewThread) {
        setThreadRefetchTrigger((prev) => prev + 1);
      }
    }

    setInput("");
  };

  const chatStarted = useMemo(() => !!messages.length, [messages.length]);

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Thread Sidebar */}
      <ThreadSidebar
        agentId={agent.agent_id}
        isOpen={threadSidebarOpen}
        onToggle={() => setThreadSidebarOpen((prev) => !prev)}
        onNewThread={handleNewThread}
        onSelectThread={handleSelectThread}
        selectedThreadId={stream.threadId}
        refetchTrigger={threadRefetchTrigger}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden",
          threadSidebarOpen && "ml-[280px]"
        )}
      >
        {/* Header */}
        <div className="relative z-10 flex h-[65px] items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Thread Sidebar Toggle */}
              <Button
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                variant="ghost"
                size="icon"
                onClick={() => setThreadSidebarOpen((prev) => !prev)}
                title={threadSidebarOpen ? "Hide threads" : "Show threads"}
              >
                <History className="size-5" />
              </Button>
              {(!sidebarOpen || !isLargeScreen) && (
                <Button
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen((p) => !p)}
                >
                  {sidebarOpen ? (
                    <PanelRightOpen className="size-5" />
                  ) : (
                    <PanelRightClose className="size-5" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Bot className="size-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {agent.agent_name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {agent.agent_description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ToolsDropdown agentId={agent.agent_id} />
            <Link href={`/agent/${agent.agent_id}/edit`}>
              <Button className="gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                <Pencil className="size-4" />
                Edit Agent
              </Button>
            </Link>
          </div>
        </div>

      {/* Messages */}
      <StickToBottom className="relative flex-1 overflow-hidden">
        <StickyToBottomContent
          className={cn(
            "absolute inset-0 overflow-y-scroll px-4 bg-white dark:bg-black [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-gray-600",
            !chatStarted && "flex flex-col items-center justify-center",
            chatStarted && "grid grid-rows-[1fr_auto]"
          )}
          contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
          content={
            <>
              {messages.map((message, index) =>
                message.type === "human" ? (
                  <AgentHumanMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                  />
                ) : (
                  <AgentAssistantMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                  />
                )
              )}
              {(isLoading || isPolling) && !firstTokenReceived && <AgentAssistantMessageLoading />}
            </>
          }
          footer={
            <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-white dark:bg-black w-full">
              {!chatStarted && (
                <div className="mx-4 flex min-h-0 grow flex-col items-center justify-center gap-4 text-center max-w-3xl w-full lg:mx-auto">
                  <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Bot className="size-8 text-gray-400" />
                  </div>
                  <h1 className="text-2xl font-medium leading-tight tracking-tighter text-gray-900 dark:text-gray-50">
                    {agent.agent_name}와 대화하세요
                  </h1>
                  <h3 className="text-base leading-tight tracking-tight font-normal text-gray-500 dark:text-gray-400">
                    {agent.agent_description || "이 에이전트에게 질문하세요"}
                  </h3>
                </div>
              )}

              <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

              <div className="mx-4 w-full max-w-3xl lg:mx-auto">
                {/* Model Label */}
                <div className="flex justify-end pr-4">
                  <span className="inline-block rounded-t border-x border-t border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {agent.model_name}
                  </span>
                </div>
              <div className={cn("bg-muted relative z-10 w-full rounded-2xl border border-solid shadow-xs transition-all mb-4", !chatStarted && "mb-[20vh]")}>
                <form
                  onSubmit={handleSubmit}
                  className="grid w-full grid-rows-[1fr_auto] gap-2"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      // Ctrl+Enter: background run
                      if (e.key === "Enter" && e.ctrlKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        forceBackgroundRef.current = true;
                        const form = (e.target as HTMLElement)?.closest("form");
                        form?.requestSubmit();
                      }
                      // Enter (without modifiers): normal submit
                      else if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.metaKey &&
                        !e.ctrlKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        const form = (e.target as HTMLElement)?.closest("form");
                        form?.requestSubmit();
                      }
                    }}
                    placeholder={`Message ${agent.agent_name}...`}
                    className="field-sizing-content min-h-[2.5rem] resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2 p-3">
                    {stream.isLoading || isPolling ? (
                      <Button key="stop" onClick={() => {
                        stream.stop();
                        stopPolling();
                        // Clear background status from localStorage if this is a background run
                        if (stream.threadId && stream.activeBackgroundRun) {
                          clearStatus(stream.threadId);
                          stream.setActiveBackgroundRun(null);
                        }
                      }}>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        취소
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsBackgroundMode((prev) => !prev)}
                          title={isBackgroundMode ? "Background mode (ON)" : "Background mode (OFF)"}
                          className={cn(
                            "rounded-full transition-all",
                            isBackgroundMode
                              ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                              : "border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"
                          )}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          type="submit"
                          className="rounded-full p-2 shadow-md transition-all"
                          disabled={isLoading || isPolling || !input.trim()}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </div>
              </div>
            </div>
          }
        />
      </StickToBottom>
      </div>
    </div>
  );
}

interface AgentThreadProps {
  agent: AgentSummary;
}

export function AgentThread({ agent }: AgentThreadProps) {
  return (
    <AgentStreamProvider agentId={agent.agent_id}>
      <AgentThreadContent agent={agent} />
    </AgentStreamProvider>
  );
}
