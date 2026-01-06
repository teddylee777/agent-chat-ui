// Agent Builder API Types
// Based on backend models from agent-builder/core/

// Agent Summary (for list view)
export interface AgentSummary {
  agent_id: string;
  agent_name: string;
  agent_description: string;
  model_name: string;
}

// Full Agent Configuration
export interface AgentConfig {
  agent_id: string;
  agent_name: string;
  agent_description: string;
  model_name: string;
  tool_list: string[];
  middleware_list: string[];
  system_prompt: string;
  project_path: string;
}

// Agent Config Update Request (all fields optional)
export interface AgentConfigUpdate {
  agent_name?: string;
  agent_description?: string;
  model_name?: string;
  tool_list?: string[];
  middleware_list?: string[];
}

// Agent Prompt
export interface AgentPrompt {
  agent_id: string;
  system_prompt: string;
  length: number;
}

// Invoke/Stream Request
export interface AgentInvokeRequest {
  message: string;
  thread_id?: string;
}

// Invoke Response
export interface AgentInvokeResponse {
  agent_id: string;
  thread_id: string;
  response: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

// Stream Events
export type StreamEventType =
  | "token"
  | "end"
  | "tool_call"
  | "tool_result";

// Content block in token events
export interface StreamContentBlock {
  text: string;
  type: string;
  index: number;
}

// Tool call chunk in tool_call events (simplified)
export interface StreamToolCallChunk {
  name: string | null;
  args: string;
}

// Token event data
export interface StreamTokenData {
  content: StreamContentBlock[];
  node: string;
}

// Tool result event data
export interface StreamToolResultData {
  name: string;
  result: string;
}

// End event data
export interface StreamEndData {
  thread_id: string;
}

export interface StreamEvent {
  event: StreamEventType;
  data: StreamToolCallChunk[] | StreamTokenData | StreamToolResultData | StreamEndData;
}

// Tool Types
export interface ToolSummary {
  tool_name: string;
  tool_description: string;
  tool_type: "built-in" | "custom" | "mcp-stdio" | "mcp-http";
}

export interface McpConfig {
  server_command?: string;
  server_args: string[];
  url?: string;
  headers: Record<string, string>;
  transport: "stdio" | "http";
  env: Record<string, string>;
}

export interface ToolInfo extends ToolSummary {
  tool_path: string;
  import_path?: string;
  init_params: Record<string, unknown>;
  mcp_config?: McpConfig;
  required_env: string[];
}

// Agent Tool Entry
export interface AgentToolEntry {
  tool_name: string;
  tool_path: string;
}

// Middleware Types
export interface MiddlewareSummary {
  middleware_name: string;
  middleware_description: string;
  middleware_type: "built-in" | "custom" | "provider";
  provider?: string;
}

export interface MiddlewareInfo extends MiddlewareSummary {
  middleware_path: string;
  import_path: string;
  default_config: Record<string, unknown>;
  use_cases: string[];
  required_env: string[];
}

// Agent Middleware Entry
export interface AgentMiddlewareEntry {
  middleware_name: string;
  middleware_path: string;
}

// Secret Types
export interface SecretEntry {
  key: string;
  masked_value: string;
  has_value: boolean;
}

export interface SecretSetRequest {
  key: string;
  value: string;
}

// API Response Wrappers
export interface AgentsListResponse {
  agents: AgentSummary[];
  total: number;
}

export interface ToolsListResponse {
  tools: ToolSummary[];
  total: number;
}

export interface AgentToolsResponse {
  agent_id: string;
  tools: AgentToolEntry[];
  total: number;
}

export interface MiddlewaresListResponse {
  middlewares: MiddlewareSummary[];
  total: number;
}

export interface AgentMiddlewaresResponse {
  agent_id: string;
  middlewares: AgentMiddlewareEntry[];
  total: number;
}

export interface SecretsListResponse {
  secrets: SecretEntry[];
  total: number;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

// Tool CRUD Types
export type ToolType = "built-in" | "custom" | "mcp-stdio" | "mcp-http";

export interface McpConfigCreate {
  server_command?: string;
  server_args?: string[];
  url?: string;
  headers?: Record<string, string>;
  transport: "stdio" | "http";
  env?: Record<string, string>;
}

export interface ToolCreateRequest {
  tool_name: string;
  tool_description: string;
  tool_type: ToolType;
  import_path?: string;
  init_params?: Record<string, unknown>;
  mcp_config?: McpConfigCreate;
  required_env?: string[];
}

export interface ToolUpdateRequest {
  new_tool_name?: string;
  tool_description?: string;
  import_path?: string;
  init_params?: Record<string, unknown>;
  mcp_config?: McpConfigCreate;
  required_env?: string[];
}

export interface ToolCreateResponse {
  success: boolean;
  tool_name: string;
  tool_path: string;
  message: string;
}

export interface ToolUpdateResponse {
  success: boolean;
  tool_name: string;
  tool_path: string;
  message: string;
}

export interface ToolDeleteResponse {
  success: boolean;
  tool_name: string;
  message: string;
}

export interface ToolUsageInfo {
  tool_name: string;
  used_by_agents: string[];
  is_in_use: boolean;
}

export interface ToolValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Chat Message for UI
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ============================================
// Thread Types
// ============================================

export type ThreadStatus = "idle" | "busy" | "interrupted" | "error";

export interface ThreadMetadata {
  first_message?: string;
  title?: string;
  [key: string]: unknown;
}

export interface Thread {
  thread_id: string;
  agent_id: string;
  status: ThreadStatus;
  created_at: string;
  updated_at: string;
  metadata: ThreadMetadata;
  message_count: number;
}

export interface ThreadCreate {
  thread_id?: string;
  metadata?: ThreadMetadata;
}

export interface ThreadListResponse {
  threads: Thread[];
  total: number;
  offset: number;
  limit: number;
}

export interface ThreadPaginationParams {
  limit?: number;
  offset?: number;
}

export interface MessageItem {
  id: string;
  type: "human" | "ai" | "tool";
  content: string | Array<{ type: string; text?: string }>;
  tool_calls?: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  tool_results?: Array<{ id: string; result: string }>;
}

export interface ThreadHistory {
  thread_id: string;
  agent_id: string;
  messages: MessageItem[];
  total: number;
}

export interface ThreadState {
  thread_id: string;
  agent_id: string;
  values: Record<string, unknown>;
  next_nodes: string[];
  checkpoint_id?: string;
}

export interface ThreadDeleteResponse {
  success: boolean;
  message: string;
}

// ============================================
// Run Types (Background Run)
// ============================================

// Run Status (백엔드와 동일)
export type RunStatus = "pending" | "running" | "success" | "error" | "cancelled";

// Run 정보
export interface Run {
  run_id: string;
  thread_id: string;
  agent_id: string;
  status: RunStatus;
  input: { messages: Array<{ role: string; content: string }> };
  output?: Record<string, unknown>;
  error?: string;
  created_at: string;
  completed_at?: string;
}

// Background Run 생성 응답
export interface BackgroundRunResponse {
  run_id: string;
  thread_id: string;
  agent_id: string;
  status: RunStatus;
  created_at: string;
  message: string;
}

// Run 생성 요청
export interface RunCreate {
  input: { messages: Array<{ role: string; content: string }> };
}

// Run 목록 응답
export interface RunListResponse {
  runs: Run[];
  total: number;
}

// Thread Background Status (UI용)
export interface ThreadBackgroundStatus {
  runId: string;
  status: RunStatus;
  viewed: boolean;
}

// ============================================
// Tool/Middleware Config Types
// ============================================

// Agent Tool Config Response
export interface AgentToolConfigResponse {
  agent_id: string;
  tool_name: string;
  base_config: Record<string, unknown>;
  config_override: Record<string, unknown>;
  merged_config: Record<string, unknown>;
}

// Agent Tool Config Update Request
export interface AgentToolConfigUpdateRequest {
  config_override: Record<string, unknown>;
}

// Agent Middleware Config Response
export interface AgentMiddlewareConfigResponse {
  agent_id: string;
  middleware_name: string;
  base_config: Record<string, unknown>;
  config_override: Record<string, unknown>;
  merged_config: Record<string, unknown>;
}

// Agent Middleware Config Update Request
export interface AgentMiddlewareConfigUpdateRequest {
  config_override: Record<string, unknown>;
}

// Config Validation Request
export interface ConfigValidationRequest {
  config_override: Record<string, unknown>;
}

// Config Validation Response
export interface ConfigValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
