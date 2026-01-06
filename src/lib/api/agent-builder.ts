// Agent Builder API Client
// Connects to FastAPI backend at localhost:8000

import type {
  AgentSummary,
  AgentConfig,
  AgentConfigUpdate,
  AgentPrompt,
  AgentsListResponse,
  ToolsListResponse,
  ToolInfo,
  AgentToolsResponse,
  MiddlewaresListResponse,
  MiddlewareInfo,
  AgentMiddlewaresResponse,
  SecretsListResponse,
  StreamEvent,
  ToolCreateRequest,
  ToolCreateResponse,
  ToolUpdateRequest,
  ToolUpdateResponse,
  ToolDeleteResponse,
  ToolUsageInfo,
  ToolValidationResponse,
  Thread,
  ThreadCreate,
  ThreadListResponse,
  ThreadPaginationParams,
  ThreadHistory,
  ThreadDeleteResponse,
  Run,
  RunCreate,
  RunListResponse,
  BackgroundRunResponse,
  AgentToolConfigResponse,
  AgentMiddlewareConfigResponse,
  ConfigValidationResponse,
} from "@/lib/types/agent-builder";

const API_BASE = "http://localhost:8000/api";

// Helper for fetch with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// Agent APIs
// ============================================

export async function getAgents(): Promise<AgentsListResponse> {
  return fetchApi<AgentsListResponse>("/agents");
}

export async function getAgent(agentId: string): Promise<AgentConfig> {
  return fetchApi<AgentConfig>(`/agents/${agentId}`);
}

export async function updateAgentConfig(
  agentId: string,
  data: AgentConfigUpdate
): Promise<AgentConfig> {
  return fetchApi<AgentConfig>(`/agents/${agentId}/config`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getAgentPrompt(agentId: string): Promise<AgentPrompt> {
  return fetchApi<AgentPrompt>(`/agents/${agentId}/prompt`);
}

export async function updateAgentPrompt(
  agentId: string,
  systemPrompt: string
): Promise<AgentPrompt> {
  return fetchApi<AgentPrompt>(`/agents/${agentId}/prompt`, {
    method: "PUT",
    body: JSON.stringify({ system_prompt: systemPrompt }),
  });
}

export async function deleteAgent(
  agentId: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/agents/${agentId}`, {
    method: "DELETE",
  });
}

// ============================================
// Agent Invoke & Stream APIs
// ============================================

export async function invokeAgent(
  agentId: string,
  message: string,
  threadId?: string
) {
  return fetchApi(`/agents/${agentId}/invoke`, {
    method: "POST",
    body: JSON.stringify({ message, thread_id: threadId }),
  });
}

// Stream chat using SSE
export async function* streamAgentChat(
  agentId: string,
  message: string,
  threadId?: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, thread_id: threadId }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE format: "data: {...}\n\n"
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || ""; // Keep incomplete chunk in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6); // Remove "data: " prefix
          try {
            const event = JSON.parse(jsonStr) as StreamEvent;
            yield event;
          } catch {
            // Skip malformed JSON
            console.warn("Failed to parse SSE event:", jsonStr);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.startsWith("data: ")) {
      const jsonStr = buffer.slice(6);
      try {
        const event = JSON.parse(jsonStr) as StreamEvent;
        yield event;
      } catch {
        // Skip malformed JSON
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================
// Tool APIs
// ============================================

export async function getTools(): Promise<ToolsListResponse> {
  return fetchApi<ToolsListResponse>("/tools");
}

export async function getTool(toolName: string): Promise<ToolInfo> {
  return fetchApi<ToolInfo>(`/tools/${toolName}`);
}

export async function getAgentTools(agentId: string): Promise<AgentToolsResponse> {
  return fetchApi<AgentToolsResponse>(`/agents/${agentId}/tools`);
}

export async function addAgentTool(
  agentId: string,
  toolName: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/agents/${agentId}/tools`, {
    method: "POST",
    body: JSON.stringify({ tool_name: toolName }),
  });
}

export async function removeAgentTool(
  agentId: string,
  toolName: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/agents/${agentId}/tools/${toolName}`, {
    method: "DELETE",
  });
}

// Tool CRUD APIs
export async function createTool(data: ToolCreateRequest): Promise<ToolCreateResponse> {
  return fetchApi<ToolCreateResponse>("/tools", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTool(
  toolName: string,
  data: ToolUpdateRequest
): Promise<ToolUpdateResponse> {
  return fetchApi<ToolUpdateResponse>(`/tools/${toolName}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTool(toolName: string): Promise<ToolDeleteResponse> {
  return fetchApi<ToolDeleteResponse>(`/tools/${toolName}`, {
    method: "DELETE",
  });
}

export async function getToolUsage(toolName: string): Promise<ToolUsageInfo> {
  return fetchApi<ToolUsageInfo>(`/tools/${toolName}/usage`);
}

export async function validateTool(data: ToolCreateRequest): Promise<ToolValidationResponse> {
  return fetchApi<ToolValidationResponse>("/tools/validate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// Middleware APIs
// ============================================

export async function getMiddlewares(): Promise<MiddlewaresListResponse> {
  return fetchApi<MiddlewaresListResponse>("/middlewares");
}

export async function getMiddleware(middlewareName: string): Promise<MiddlewareInfo> {
  return fetchApi<MiddlewareInfo>(`/middlewares/${middlewareName}`);
}

export async function getAgentMiddlewares(
  agentId: string
): Promise<AgentMiddlewaresResponse> {
  return fetchApi<AgentMiddlewaresResponse>(`/agents/${agentId}/middlewares`);
}

export async function addAgentMiddleware(
  agentId: string,
  middlewareName: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/agents/${agentId}/middlewares`, {
    method: "POST",
    body: JSON.stringify({ middleware_name: middlewareName }),
  });
}

export async function removeAgentMiddleware(
  agentId: string,
  middlewareName: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/agents/${agentId}/middlewares/${middlewareName}`, {
    method: "DELETE",
  });
}

// ============================================
// Secret APIs
// ============================================

export async function getSecrets(): Promise<SecretsListResponse> {
  return fetchApi<SecretsListResponse>("/secrets");
}

export async function setSecret(
  key: string,
  value: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi("/secrets", {
    method: "POST",
    body: JSON.stringify({ key, value }),
  });
}

export async function deleteSecret(
  key: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/secrets/${key}`, {
    method: "DELETE",
  });
}

// ============================================
// Health Check
// ============================================

export async function checkHealth(): Promise<{ status: string; service: string }> {
  return fetchApi("/health");
}

// ============================================
// Thread APIs
// ============================================

export async function getThreads(
  agentId: string,
  params: ThreadPaginationParams = { limit: 20, offset: 0 }
): Promise<ThreadListResponse> {
  const queryParams = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
  });
  return fetchApi<ThreadListResponse>(
    `/agents/${agentId}/threads?${queryParams}`
  );
}

export async function getThread(
  agentId: string,
  threadId: string
): Promise<Thread> {
  return fetchApi<Thread>(`/agents/${agentId}/threads/${threadId}`);
}

export async function createThread(
  agentId: string,
  data: ThreadCreate = {}
): Promise<Thread> {
  return fetchApi<Thread>(`/agents/${agentId}/threads`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteThread(
  agentId: string,
  threadId: string
): Promise<ThreadDeleteResponse> {
  return fetchApi<ThreadDeleteResponse>(
    `/agents/${agentId}/threads/${threadId}`,
    { method: "DELETE" }
  );
}

export async function getThreadHistory(
  agentId: string,
  threadId: string
): Promise<ThreadHistory> {
  return fetchApi<ThreadHistory>(
    `/agents/${agentId}/threads/${threadId}/history`
  );
}

// ============================================
// Run APIs (Background Run)
// ============================================

export async function createBackgroundRun(
  agentId: string,
  threadId: string,
  data: RunCreate
): Promise<BackgroundRunResponse> {
  return fetchApi<BackgroundRunResponse>(
    `/agents/${agentId}/threads/${threadId}/runs/background`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function getRun(
  agentId: string,
  threadId: string,
  runId: string
): Promise<Run> {
  return fetchApi<Run>(
    `/agents/${agentId}/threads/${threadId}/runs/${runId}`
  );
}

export async function listRuns(
  agentId: string,
  threadId: string,
  limit: number = 20
): Promise<RunListResponse> {
  return fetchApi<RunListResponse>(
    `/agents/${agentId}/threads/${threadId}/runs?limit=${limit}`
  );
}

// ============================================
// Agent Tool Config APIs
// ============================================

export async function getAgentToolConfig(
  agentId: string,
  toolName: string
): Promise<AgentToolConfigResponse> {
  return fetchApi<AgentToolConfigResponse>(
    `/agents/${agentId}/tools/${toolName}/config`
  );
}

export async function updateAgentToolConfig(
  agentId: string,
  toolName: string,
  configOverride: Record<string, unknown>
): Promise<AgentToolConfigResponse> {
  return fetchApi<AgentToolConfigResponse>(
    `/agents/${agentId}/tools/${toolName}/config`,
    {
      method: "PUT",
      body: JSON.stringify({ config_override: configOverride }),
    }
  );
}

export async function validateAgentToolConfig(
  agentId: string,
  toolName: string,
  configOverride: Record<string, unknown>
): Promise<ConfigValidationResponse> {
  return fetchApi<ConfigValidationResponse>(
    `/agents/${agentId}/tools/${toolName}/config/validate`,
    {
      method: "POST",
      body: JSON.stringify({ config_override: configOverride }),
    }
  );
}

// ============================================
// Agent Middleware Config APIs
// ============================================

export async function getAgentMiddlewareConfig(
  agentId: string,
  middlewareName: string
): Promise<AgentMiddlewareConfigResponse> {
  return fetchApi<AgentMiddlewareConfigResponse>(
    `/agents/${agentId}/middlewares/${middlewareName}/config`
  );
}

export async function updateAgentMiddlewareConfig(
  agentId: string,
  middlewareName: string,
  configOverride: Record<string, unknown>
): Promise<AgentMiddlewareConfigResponse> {
  return fetchApi<AgentMiddlewareConfigResponse>(
    `/agents/${agentId}/middlewares/${middlewareName}/config`,
    {
      method: "PUT",
      body: JSON.stringify({ config_override: configOverride }),
    }
  );
}

export async function validateAgentMiddlewareConfig(
  agentId: string,
  middlewareName: string,
  configOverride: Record<string, unknown>
): Promise<ConfigValidationResponse> {
  return fetchApi<ConfigValidationResponse>(
    `/agents/${agentId}/middlewares/${middlewareName}/config/validate`,
    {
      method: "POST",
      body: JSON.stringify({ config_override: configOverride }),
    }
  );
}
