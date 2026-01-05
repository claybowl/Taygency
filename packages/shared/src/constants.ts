export const APP_NAME = "Vibe Planning";
export const DEFAULT_TIMEZONE = "America/Chicago";

// Single-user workspace - no user ID in path
export const DATA_ROOT = "/data";

export const WORKSPACE_DIRS = [
  "meta",
  "inbox",
  "tasks/active",
  "tasks/completed",
  "tasks/someday",
  "context",
  "skills",
  "conversations",
] as const;

export const DEFAULT_CATEGORIES = [
  "work",
  "personal",
  "home",
  "errands",
  "health",
  "finance",
  "learning",
  "inbox",
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

export const DEFAULT_PRIORITY = "medium" as const;
export const DEFAULT_CATEGORY = "inbox" as const;
export const DEFAULT_STATUS = "active" as const;

// Simple daily rate limits for prototype (not per-user)
export const RATE_LIMITS = {
  email: 50,
  sms: 25,
} as const;

export const API_ENDPOINTS = {
  agent: {
    process: "/process",
    tasks: "/tasks",
    health: "/health",
  },
  web: {
    emailInbound: "/api/email/inbound",
    vapiWebhook: "/api/vapi/webhook",
    dashboardTasks: "/api/dashboard/tasks",
  },
} as const;

export const CLAUDE_CONFIG = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
} as const;

export const MESSAGES = {
  welcome: `Welcome to Vibe Planning! I've organized your tasks. Reply to adjust, or text me for quick access.`,
  rateLimitExceeded: `You've reached the daily limit. Try again tomorrow!`,
  processingError: `Sorry, something went wrong. Please try again in a moment.`,
} as const;
