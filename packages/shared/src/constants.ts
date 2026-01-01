export const APP_NAME = 'Vibe Planning';
export const DEFAULT_TIMEZONE = 'America/Chicago';

export const DATA_ROOT = '/data/users';

export const WORKSPACE_DIRS = [
  'meta',
  'inbox',
  'tasks/active',
  'tasks/completed',
  'tasks/someday',
  'context',
  'skills',
  'conversations',
] as const;

export const DEFAULT_CATEGORIES = [
  'work',
  'personal',
  'home',
  'errands',
  'health',
  'finance',
  'learning',
  'inbox',
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

export const DEFAULT_PRIORITY = 'medium' as const;
export const DEFAULT_CATEGORY = 'inbox' as const;
export const DEFAULT_STATUS = 'active' as const;

export const RATE_LIMITS = {
  email: { free: 20, pro: 100 },
  sms: { free: 10, pro: 50 },
} as const;

export const API_ENDPOINTS = {
  agent: {
    process: '/process',
    health: '/health',
  },
  web: {
    emailInbound: '/api/email/inbound',
    vapiWebhook: '/api/vapi/webhook',
    authSignup: '/api/auth/signup',
    authVerify: '/api/auth/verify',
    dashboardTasks: '/api/dashboard/tasks',
  },
} as const;

export const CLAUDE_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
} as const;

export const MESSAGES = {
  welcome: `Welcome to Vibe Planning! I've organized your tasks. Reply to adjust, or text me for quick access.`,
  unknownUser: `Welcome! Text your email address to link your Vibe Planning account, or email tasks@vibeplan.com to get started.`,
  rateLimitExceeded: `You've reached your daily limit. Upgrade to Pro for more, or try again tomorrow!`,
  processingError: `Sorry, something went wrong. Please try again in a moment.`,
} as const;
