export interface AgentRequest {
  channel: Channel;
  message: string;
  context: {
    subject?: string;
    conversationId?: string;
    replyToMessageId?: string;
    phoneNumber?: string;
  };
}

export interface AgentResponse {
  success: boolean;
  message: string;
  actions: AgentAction[];
  metadata: {
    tokensUsed: number;
    processingTimeMs: number;
    skillsExecuted: string[];
  };
}

export type Channel = "email" | "sms" | "voice" | "app";

export type AgentAction =
  | { type: "task_created"; taskId: string; title: string }
  | { type: "task_updated"; taskId: string; changes: Record<string, unknown> }
  | { type: "task_completed"; taskId: string }
  | { type: "file_written"; path: string }
  | { type: "skill_executed"; skill: string; result: string };

export type TaskStatus = "active" | "completed" | "someday";
export type TaskPriority = "high" | "medium" | "low";
export type EnergyLevel = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  energy?: EnergyLevel;
  duration?: string;
  context?: string[];
  due?: string;
  project?: string;
  source?: Channel;
  notes?: string;
  subtasks?: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  title: string;
  completed: boolean;
}

export interface TaskInput {
  title: string;
  priority?: TaskPriority;
  category?: string;
  energy?: EnergyLevel;
  duration?: string;
  context?: string[];
  due?: string;
  project?: string;
  notes?: string;
  subtasks?: string[];
}

export interface OwnerPreferences {
  morningStart?: string;
  eveningEnd?: string;
  preferredChannel?: Channel;
  dailySummary?: boolean;
  dailySummaryTime?: string;
}

export interface WorkspaceConfig {
  timezone: string;
  preferences: OwnerPreferences;
  createdAt: string;
  lastActive: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface Skill {
  name: string;
  version: string;
  trigger?: string;
  description?: string;
  content: string;
  tools?: Tool[];
  isCodeBased?: boolean;
}

export interface SkillResult {
  success: boolean;
  output: string;
  changes?: AgentAction[];
  data?: Record<string, unknown>;
}

export interface TasksResponse {
  tasks: Task[];
  categories: CategoryCount[];
  stats: TaskStats;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  active: number;
}

export interface SendGridInboundPayload {
  headers: string;
  dkim: string;
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  sender_ip: string;
  spam_report: string;
  spam_score: string;
  charsets: string;
  SPF: string;
  envelope: string;
  attachments: string;
  "attachment-info"?: string;
}

export interface VAPIWebhookPayload {
  message: VAPIMessage;
}

export type VAPIMessageType =
  | "conversation-update"
  | "tool-calls"
  | "status-update"
  | "assistant-request"
  | "end-of-call-report"
  | "speech-update"
  | "hang";

export interface VAPIMessage {
  type: VAPIMessageType;
  role?: "user" | "assistant";
  content?: string;
  call?: VAPICall;
  transcript?: string;
  status?: string;
  toolCallList?: VAPIToolCall[];
  messages?: VAPIConversationMessage[];
}

export interface VAPICall {
  id: string;
  phoneNumber: {
    id: string;
    number: string;
  };
  customer: {
    number: string;
    firstName?: string;
    lastName?: string;
  };
  status?: string;
  duration?: number;
  cost?: number;
}

export interface VAPIToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface VAPIConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface VAPIToolResult {
  toolCallId: string;
  name: string;
  result: string;
}

export interface VAPIWebhookResponse {
  results?: VAPIToolResult[];
  message?: string;
  success?: boolean;
  received?: boolean;
  assistantId?: string;
}

export interface SearchResult {
  path: string;
  snippet: string;
}

export interface FileChange {
  path: string;
  content: string;
  operation: "create" | "update" | "delete";
  timestamp: string;
}

export type AgentLogLevel = "debug" | "info" | "warn" | "error";

export type AgentLogEvent =
  | { type: "request_received"; channel: Channel; messagePreview: string }
  | { type: "workspace_check"; exists: boolean; initialized: boolean }
  | { type: "context_built"; taskCount: number; hasPreferences: boolean }
  | { type: "skills_loaded"; count: number; metaSkillCount: number }
  | { type: "system_prompt_built"; tokenEstimate: number }
  | { type: "llm_request_start"; model: string; messageCount: number }
  | {
      type: "llm_request_complete";
      promptTokens: number;
      completionTokens: number;
      finishReason: string;
    }
  | { type: "tool_call_start"; toolName: string; args: Record<string, unknown> }
  | {
      type: "tool_call_complete";
      toolName: string;
      success: boolean;
      resultPreview: string;
    }
  | { type: "tool_call_error"; toolName: string; error: string }
  | { type: "skill_execution_start"; skillName: string }
  | { type: "skill_execution_complete"; skillName: string; success: boolean }
  | {
      type: "iteration_complete";
      iterationNumber: number;
      hasMoreToolCalls: boolean;
    }
  | { type: "response_generated"; messageLength: number; actionCount: number }
  | { type: "error"; message: string; stack?: string };

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  level: AgentLogLevel;
  event: AgentLogEvent;
  durationMs?: number;
}

export interface AgentExecutionTrace {
  traceId: string;
  startTime: string;
  endTime?: string;
  logs: AgentLogEntry[];
  summary?: {
    totalDurationMs: number;
    llmCalls: number;
    toolCalls: number;
    tokensUsed: number;
    success: boolean;
  };
}
