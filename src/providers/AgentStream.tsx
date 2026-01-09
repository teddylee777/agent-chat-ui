"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "@langchain/langgraph-sdk";
import { streamAgentChat, getThreadHistory, createBackgroundRun, createThread } from "@/lib/api/agent-builder";
import type { BackgroundRunResponse, ContentBlock } from "@/lib/types/agent-builder";

// Simplified state type matching StreamProvider
export type AgentStateType = { messages: Message[] };

// Background run info
interface ActiveBackgroundRun {
  runId: string;
  threadId: string;
}

// Context type matching essential StreamProvider interface
interface AgentStreamContextType {
  // State
  messages: Message[];
  values: AgentStateType;
  isLoading: boolean;
  error: unknown;

  // Methods
  submit: (
    values: { messages?: Message[] } | null | undefined,
    options?: { optimisticValues?: (prev: AgentStateType) => Partial<AgentStateType> }
  ) => Promise<void>;
  stop: () => Promise<void>;

  // Background run methods
  submitBackground: (
    values: { messages?: Message[] } | null | undefined
  ) => Promise<BackgroundRunResponse | null>;
  activeBackgroundRun: ActiveBackgroundRun | null;
  setActiveBackgroundRun: (run: ActiveBackgroundRun | null) => void;

  // Agent-specific
  agentId: string;
  threadId: string | null;

  // Thread management
  loadThread: (threadId: string) => Promise<void>;
  clearThread: () => void;

  // Stub methods for compatibility (features not supported by agent-builder)
  interrupt: undefined;
  branch: string;
  setBranch: (branch: string) => void;
  history: [];
  getMessagesMetadata: () => undefined;
}

const AgentStreamContext = createContext<AgentStreamContextType | undefined>(
  undefined
);

interface AgentStreamProviderProps {
  agentId: string;
  children: ReactNode;
}

export function AgentStreamProvider({
  agentId,
  children,
}: AgentStreamProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [activeBackgroundRun, setActiveBackgroundRun] = useState<ActiveBackgroundRun | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Track current tool call being streamed (chunks are accumulated)
  const currentToolCallRef = useRef<{
    id: string;
    name: string;
    args: string;
  } | null>(null);

  // Ref to access messages in callbacks without adding to dependencies
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const stop = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const loadThread = useCallback(
    async (loadThreadId: string) => {
      setError(null);

      try {
        const history = await getThreadHistory(agentId, loadThreadId);
        setMessages(history.messages as Message[]);
        setThreadId(history.thread_id);
      } catch (err) {
        setError(err);
      }
    },
    [agentId]
  );

  const clearThread = useCallback(() => {
    setMessages([]);
    setThreadId(null);
    setError(null);
    setActiveBackgroundRun(null);
  }, []);

  const submitBackground = useCallback(
    async (
      values: { messages?: Message[] } | null | undefined
    ): Promise<BackgroundRunResponse | null> => {
      // Get the last human message from input
      const inputMessages = values?.messages || [];
      const lastHumanMessage = inputMessages.find((m) => m.type === "human");

      if (!lastHumanMessage || typeof lastHumanMessage.content !== "string") {
        return null;
      }

      const userContent = lastHumanMessage.content;

      // Generate or use existing thread ID
      let currentThreadId = threadId;
      if (!currentThreadId) {
        // Create a new thread first
        try {
          const newThread = await createThread(agentId, {
            metadata: { first_message: userContent.slice(0, 100) },
          });
          currentThreadId = newThread.thread_id;
          setThreadId(currentThreadId);
        } catch (err) {
          setError(err);
          return null;
        }
      }

      // Add user message to UI immediately
      const humanMessage: Message = {
        id: lastHumanMessage.id || uuidv4(),
        type: "human",
        content: userContent,
      };
      setMessages((prev) => [...prev, humanMessage]);

      // Create background run
      try {
        const response = await createBackgroundRun(agentId, currentThreadId, {
          input: {
            messages: [{ role: "user", content: userContent }],
          },
        });

        // Set active background run
        setActiveBackgroundRun({
          runId: response.run_id,
          threadId: currentThreadId,
        });

        return response;
      } catch (err) {
        setError(err);
        return null;
      }
    },
    [agentId, threadId]
  );

  const submit = useCallback(
    async (
      values: { messages?: Message[] } | null | undefined,
      options?: { optimisticValues?: (prev: AgentStateType) => Partial<AgentStateType> }
    ) => {
      // Get the last human message from input
      const inputMessages = values?.messages || [];
      const lastHumanMessage = inputMessages.find((m) => m.type === "human");

      if (!lastHumanMessage || typeof lastHumanMessage.content !== "string") {
        return;
      }

      const userContent = lastHumanMessage.content;

      // Create thread via API first if this is a new conversation
      // (mirrors submitBackground behavior for consistency)
      let currentThreadId = threadId;
      if (!currentThreadId) {
        try {
          const newThread = await createThread(agentId, {
            metadata: { first_message: userContent.slice(0, 100) },
          });
          currentThreadId = newThread.thread_id;
          setThreadId(currentThreadId);
        } catch (err) {
          setError(err);
          return;
        }
      }

      // Apply optimistic update if provided
      if (options?.optimisticValues) {
        const optimistic = options.optimisticValues({ messages: messagesRef.current });
        if (optimistic.messages) {
          setMessages(optimistic.messages as Message[]);
        }
      } else {
        // Add user message optimistically
        const humanMessage: Message = {
          id: lastHumanMessage.id || uuidv4(),
          type: "human",
          content: userContent,
        };
        setMessages((prev) => [...prev, humanMessage]);
      }

      // Create AI message placeholder with content_blocks for ordered rendering
      const aiMessageId = uuidv4();
      const aiMessage: Message & { content_blocks: ContentBlock[] } = {
        id: aiMessageId,
        type: "ai",
        content: "",
        content_blocks: [],
      };
      setMessages((prev) => [...prev, aiMessage]);

      setIsLoading(true);
      setError(null);

      // Create abort controller for this stream
      abortControllerRef.current = new AbortController();

      try {
        const stream = streamAgentChat(
          agentId,
          userContent,
          currentThreadId,
          abortControllerRef.current.signal
        );

        // Helper to finalize current tool call with parsed args
        const finalizeCurrentToolCall = () => {
          if (currentToolCallRef.current) {
            const toolCall = currentToolCallRef.current;
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(toolCall.args);
            } catch {
              // Args might be incomplete or invalid JSON
            }

            // Update tool call with parsed args
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === aiMessageId && msg.type === "ai") {
                  const existingToolCalls = (msg as any).tool_calls || [];
                  return {
                    ...msg,
                    tool_calls: existingToolCalls.map((tc: any) =>
                      tc.id === toolCall.id
                        ? { ...tc, args: parsedArgs }
                        : tc
                    ),
                  };
                }
                return msg;
              })
            );
            currentToolCallRef.current = null;
          }
        };

        for await (const event of stream) {
          if (event.event === "token") {
            // Finalize any pending tool call before processing token
            finalizeCurrentToolCall();

            // Extract text from content (string or array format)
            const tokenData = event.data as { content: string | Array<{ text: string }>; node: string };
            const content = tokenData.content;
            // Handle both string (backend sends) and array (legacy) formats
            const text = typeof content === "string"
              ? content
              : Array.isArray(content)
                ? content[0]?.text || ""
                : "";
            if (text) {
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === aiMessageId) {
                    const blocks = (msg as any).content_blocks || [];
                    const lastBlock = blocks[blocks.length - 1];

                    // If last block is text, append to it; otherwise create new text block
                    let newBlocks: ContentBlock[];
                    if (lastBlock?.type === "text") {
                      newBlocks = [
                        ...blocks.slice(0, -1),
                        { ...lastBlock, content: lastBlock.content + text },
                      ];
                    } else {
                      newBlocks = [...blocks, { type: "text" as const, content: text }];
                    }

                    return {
                      ...msg,
                      content: (msg.content as string) + text,
                      content_blocks: newBlocks,
                    };
                  }
                  return msg;
                })
              );
            }
          } else if (event.event === "tool_call") {
            // data is now a direct array: [{name, args}]
            const chunks = event.data as Array<{ name: string | null; args: string }>;
            const tc = chunks[0];
            if (!tc) continue;

            // First chunk has name - finalize previous tool call and start new one
            if (tc.name) {
              // Finalize any pending tool call before starting new one
              finalizeCurrentToolCall();

              const toolCallId = uuidv4();
              currentToolCallRef.current = {
                id: toolCallId,
                name: tc.name,
                args: tc.args || "",
              };
              // Add tool call to message and content_blocks
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === aiMessageId && msg.type === "ai") {
                    const existingToolCalls = (msg as any).tool_calls || [];
                    const blocks = (msg as any).content_blocks || [];
                    const toolCallBlock: ContentBlock = {
                      type: "tool_call",
                      id: toolCallId,
                      name: tc.name!,
                      args: {},
                    };
                    return {
                      ...msg,
                      tool_calls: [
                        ...existingToolCalls,
                        {
                          id: toolCallId,
                          name: tc.name,
                          args: {},
                        },
                      ],
                      content_blocks: [...blocks, toolCallBlock],
                    };
                  }
                  return msg;
                })
              );
            } else if (currentToolCallRef.current) {
              // Subsequent chunks have args fragments
              currentToolCallRef.current.args += tc.args || "";
            }
          } else if (event.event === "tool_result") {
            // Finalize any pending tool call before processing result
            finalizeCurrentToolCall();

            const resultData = event.data as { result: string };
            const resultId = uuidv4();

            // Add tool result to tool_results array and content_blocks
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === aiMessageId && msg.type === "ai") {
                  const existingResults = (msg as any).tool_results || [];
                  const blocks = (msg as any).content_blocks || [];
                  const toolResultBlock: ContentBlock = {
                    type: "tool_result",
                    result: resultData.result,
                  };
                  return {
                    ...msg,
                    tool_results: [
                      ...existingResults,
                      { id: resultId, result: resultData.result },
                    ],
                    content_blocks: [...blocks, toolResultBlock],
                  };
                }
                return msg;
              })
            );
          } else if (event.event === "end") {
            // Finalize any pending tool call before ending
            finalizeCurrentToolCall();

            // Update thread ID if returned
            const endData = event.data as { thread_id?: string };
            if (endData?.thread_id) {
              setThreadId(endData.thread_id);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [agentId, threadId]
  );

  const contextValue = useMemo<AgentStreamContextType>(
    () => ({
      messages,
      values: { messages },
      isLoading,
      error,
      submit,
      stop,
      submitBackground,
      activeBackgroundRun,
      setActiveBackgroundRun,
      agentId,
      threadId,
      loadThread,
      clearThread,
      // Stub values for features not supported by agent-builder
      interrupt: undefined,
      branch: "main",
      setBranch: () => {},
      history: [],
      getMessagesMetadata: () => undefined,
    }),
    [messages, isLoading, error, submit, stop, submitBackground, activeBackgroundRun, agentId, threadId, loadThread, clearThread]
  );

  return (
    <AgentStreamContext.Provider value={contextValue}>
      {children}
    </AgentStreamContext.Provider>
  );
}

export function useAgentStreamContext(): AgentStreamContextType {
  const context = useContext(AgentStreamContext);
  if (context === undefined) {
    throw new Error(
      "useAgentStreamContext must be used within an AgentStreamProvider"
    );
  }
  return context;
}

export default AgentStreamContext;
