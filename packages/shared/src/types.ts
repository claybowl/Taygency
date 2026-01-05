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

export interface Skill {
  name: string;
  version: string;
  trigger: string;
  description?: string;
  content: string;
}

export interface SkillResult {
  success: boolean;
  output: string;
  changes?: AgentAction[];
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

export interface VAPIMessage {
  type: "conversation-update" | "end-of-call-report" | "hang" | "speech-update";
  role?: "user" | "assistant";
  content?: string;
  call?: VAPICall;
}

export interface VAPICall {
  id: string;
  phoneNumber: {
    id: string;
    number: string;
  };
  customer: {
    number: string;
  };
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
