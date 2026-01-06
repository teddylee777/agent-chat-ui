"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createAgent } from "@/lib/api/agent-builder";
import type { AgentConfig } from "@/lib/types/agent-builder";
import { toast } from "sonner";

// Default config for new agent
const DEFAULT_CONFIG: Omit<AgentConfig, "agent_id" | "project_path"> = {
  agent_name: "",
  agent_description: "",
  model_name: "anthropic:claude-haiku-4-5",
  system_prompt: "",
  tool_list: [],
  middleware_list: [],
};

interface AgentCreateContextType {
  config: Omit<AgentConfig, "agent_id" | "project_path">;
  isCreating: boolean;
  error: string | null;
  updateField: <K extends keyof typeof DEFAULT_CONFIG>(
    field: K,
    value: (typeof DEFAULT_CONFIG)[K]
  ) => void;
  create: () => Promise<string | null>; // Returns agent_id on success, null on failure
  reset: () => void;
}

const AgentCreateContext = createContext<AgentCreateContextType | undefined>(
  undefined
);

export function AgentCreateProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] =
    useState<Omit<AgentConfig, "agent_id" | "project_path">>(DEFAULT_CONFIG);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update a single field
  const updateField = useCallback(
    <K extends keyof typeof DEFAULT_CONFIG>(
      field: K,
      value: (typeof DEFAULT_CONFIG)[K]
    ) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Create the agent
  const create = useCallback(async (): Promise<string | null> => {
    if (!config.agent_name.trim()) {
      toast.error("Agent name is required");
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createAgent({
        agent_name: config.agent_name,
        agent_description: config.agent_description,
        model_name: config.model_name,
        system_prompt: config.system_prompt,
        tool_list: config.tool_list,
        middleware_list: config.middleware_list,
      });

      toast.success("Agent created successfully");
      return result.agent_id;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create agent";
      setError(errorMessage);
      toast.error("Failed to create agent", {
        description: errorMessage,
        richColors: true,
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [config]);

  // Reset to default config
  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setError(null);
  }, []);

  const value = useMemo<AgentCreateContextType>(
    () => ({
      config,
      isCreating,
      error,
      updateField,
      create,
      reset,
    }),
    [config, isCreating, error, updateField, create, reset]
  );

  return (
    <AgentCreateContext.Provider value={value}>
      {children}
    </AgentCreateContext.Provider>
  );
}

export function useAgentCreate() {
  const context = useContext(AgentCreateContext);
  if (context === undefined) {
    throw new Error(
      "useAgentCreate must be used within an AgentCreateProvider"
    );
  }
  return context;
}
