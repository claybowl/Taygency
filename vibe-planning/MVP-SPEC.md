# Vibe Planning - MVP Implementation Specification

## Executive Summary

Build an AI-powered task management system accessible via email and SMS, backed by a file-system-based workspace. MVP delivers core email + SMS functionality with Claude-powered task parsing and organization.

**Timeline**: 6 weeks  
**Budget**: ~$100/mo infrastructure at launch

---

## 1. MVP Feature Matrix

### Phase 1 (MVP) - Weeks 1-6
| Feature | Channel | Priority | Status |
|---------|---------|----------|--------|
| Email: Receive task brain dump | Email | P0 | |
| Email: Parse and categorize tasks | Email | P0 | |
| Email: Reply with organized view | Email | P0 | |
| SMS: Quick query ("what should I do?") | SMS | P0 | |
| SMS: Add single task | SMS | P0 | |
| SMS: Mark task complete | SMS | P0 | |
| File system: User workspace | Core | P0 | |
| File system: Task CRUD | Core | P0 | |
| Skills: Categorization | Core | P0 | |
| Skills: Prioritization | Core | P0 | |
| Web: View-only dashboard | Web | P1 | |
| Auth: Email-based signup | Core | P0 | |

### Phase 2 (Post-MVP) - Not in scope
- Voice calling (VAPI)
- Mobile app (React Native)
- Calendar integration
- Custom skills UI
- Team workspaces

---

## 2. Technical Architecture

### 2.1 System Diagram

```
                              ┌─────────────────────┐
                              │    Your Domain      │
                              │  (vibeplan.com)     │
                              └──────────┬──────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐            ┌─────────────────┐
│    SendGrid     │           │     Vercel      │            │      VAPI       │
│  Inbound Parse  │           │  Edge Functions │            │    Voice/SMS    │
│                 │           │                 │            │                 │
│ MX: tasks.      │           │ /api/email      │            │ Webhook to      │
│ vibeplan.com    │──────────▶│ /api/vapi       │◀───────────│ /api/vapi       │
│                 │           │ /api/auth       │            │                 │
└─────────────────┘           │ /api/dashboard  │            └─────────────────┘
                              └────────┬────────┘
                                       │
                                       │ REST API
                                       ▼
                              ┌─────────────────┐
                              │    Fly.io       │
                              │  Agent Service  │
                              │                 │
                              │ ┌─────────────┐ │
                              │ │ Claude SDK  │ │
                              │ │ Agent Core  │ │
                              │ └──────┬──────┘ │
                              │        │        │
                              │ ┌──────▼──────┐ │
                              │ │  Fly Volume │ │
                              │ │  /data/     │ │
                              │ │  users/     │ │
                              │ └─────────────┘ │
                              └────────┬────────┘
                                       │
                                       │ Async backup
                                       ▼
                              ┌─────────────────┐
                              │ Cloudflare R2   │
                              │ (backup/export) │
                              └─────────────────┘
```

### 2.2 Repository Structure

```
vibe-planning/
├── apps/
│   ├── web/                      # Vercel deployment
│   │   ├── api/
│   │   │   ├── email/
│   │   │   │   └── inbound.ts    # SendGrid webhook
│   │   │   ├── vapi/
│   │   │   │   └── webhook.ts    # VAPI webhook
│   │   │   ├── auth/
│   │   │   │   ├── signup.ts
│   │   │   │   └── verify.ts
│   │   │   └── dashboard/
│   │   │       └── tasks.ts      # Dashboard API
│   │   ├── app/                  # Next.js app router
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Dashboard UI
│   │   │   └── layout.tsx
│   │   ├── lib/
│   │   │   ├── sendgrid.ts       # SendGrid client
│   │   │   ├── vapi.ts           # VAPI client
│   │   │   ├── agent.ts          # Agent client (calls Fly)
│   │   │   └── auth.ts           # Auth helpers
│   │   ├── package.json
│   │   └── vercel.json
│   │
│   └── agent/                    # Fly.io deployment
│       ├── src/
│       │   ├── index.ts          # Express server
│       │   ├── agent/
│       │   │   ├── core.ts       # Claude Agent wrapper
│       │   │   ├── tools.ts      # File system tools
│       │   │   └── skills.ts     # Skill executor
│       │   ├── filesystem/
│       │   │   ├── workspace.ts  # Workspace manager
│       │   │   ├── tasks.ts      # Task file operations
│       │   │   └── sync.ts       # R2 backup sync
│       │   └── routes/
│       │       └── process.ts    # Main processing endpoint
│       ├── skills/               # Default skills (copied to new users)
│       │   ├── categorize.md
│       │   ├── prioritize.md
│       │   └── daily-planning.md
│       ├── Dockerfile
│       ├── fly.toml
│       └── package.json
│
├── packages/
│   └── shared/                   # Shared types
│       ├── types.ts
│       └── constants.ts
│
├── .env.example
├── package.json                  # Monorepo root
├── turbo.json                    # Turborepo config
└── README.md
```

---

## 3. API Contracts

### 3.1 Vercel → Fly.io Agent

```typescript
// POST https://vibe-planning-agent.fly.dev/process
interface AgentRequest {
  userId: string;
  channel: 'email' | 'sms';
  message: string;
  context: {
    subject?: string;           // Email subject
    conversationId?: string;    // Thread ID
    replyToMessageId?: string;  // For email threading
    phoneNumber?: string;       // SMS sender
  };
}

interface AgentResponse {
  success: boolean;
  message: string;              // Response to send back to user
  actions: AgentAction[];       // Actions performed (for logging)
  metadata: {
    tokensUsed: number;
    processingTimeMs: number;
    skillsExecuted: string[];
  };
}

type AgentAction = 
  | { type: 'task_created'; taskId: string; title: string }
  | { type: 'task_updated'; taskId: string; changes: object }
  | { type: 'task_completed'; taskId: string }
  | { type: 'file_written'; path: string }
  | { type: 'skill_executed'; skill: string; result: string };
```

### 3.2 SendGrid Inbound Webhook

```typescript
// POST /api/email/inbound
// Content-Type: multipart/form-data

interface SendGridInboundPayload {
  headers: string;              // Raw email headers
  dkim: string;                 // DKIM verification
  to: string;                   // Recipient
  from: string;                 // Sender (extract email)
  subject: string;              // Email subject
  text: string;                 // Plain text body
  html: string;                 // HTML body
  sender_ip: string;            // Sender IP
  spam_report: string;          // Spam analysis
  spam_score: string;           // Spam score
  charsets: string;             // Character sets (JSON)
  SPF: string;                  // SPF result
  envelope: string;             // Envelope (JSON)
  attachments: string;          // Number of attachments
  'attachment-info': string;    // Attachment metadata (JSON)
  'attachment1'?: File;         // Actual attachment files
}
```

### 3.3 VAPI Webhook

```typescript
// POST /api/vapi/webhook
interface VAPIWebhookPayload {
  message: {
    type: 'conversation-update' | 'end-of-call-report' | 'hang' | 'speech-update';
    // Type-specific fields vary
  };
}

// SMS specifically
interface VAPISMSMessage {
  type: 'conversation-update';
  role: 'user' | 'assistant';
  content: string;
  call?: {
    id: string;
    phoneNumber: {
      id: string;
      number: string;
    };
    customer: {
      number: string;  // User's phone number
    };
  };
}
```

### 3.4 Dashboard API

```typescript
// GET /api/dashboard/tasks?status=active
interface TasksResponse {
  tasks: Task[];
  categories: { name: string; count: number }[];
  stats: {
    total: number;
    completed: number;
    active: number;
  };
}

interface Task {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'someday';
  priority: 'high' | 'medium' | 'low';
  category: string;
  due?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. File System Specification

### 4.1 Workspace Structure

```
/data/users/{userId}/
├── meta/
│   └── config.json              # User configuration
├── inbox/
│   └── {date}-{source}.md       # Raw imports (kept for reference)
├── tasks/
│   ├── active/
│   │   └── {taskId}.md          # Active tasks
│   ├── completed/
│   │   └── {taskId}.md          # Completed tasks
│   └── someday/
│       └── {taskId}.md          # Someday/maybe tasks
├── context/
│   ├── preferences.md           # User preferences (learned)
│   └── history.md               # Interaction history summary
├── skills/
│   ├── categorize.md            # Categorization skill
│   ├── prioritize.md            # Prioritization skill
│   └── daily-planning.md        # Daily planning skill
└── conversations/
    └── {date}-{channel}.md      # Conversation logs
```

### 4.2 Task File Format

```markdown
---
id: task-2025-12-31-001
title: Buy groceries for dinner party
status: active
priority: high
category: errands
energy: low
duration: 45m
context:
  - car-required
  - weekend
due: 2025-12-31T17:00:00Z
project: dinner-party
source: email
created: 2025-12-31T10:30:00Z
updated: 2025-12-31T14:00:00Z
---

# Buy groceries for dinner party

## Notes
Sarah mentioned she's vegetarian - need veggie options.
Check Whole Foods for organic produce.

## Subtasks
- [ ] Check pantry for existing items
- [ ] Make shopping list
- [ ] Go to Whole Foods

## History
- 2025-12-31T10:30:00Z - Created from email import
- 2025-12-31T14:00:00Z - Priority upgraded (deadline approaching)
```

### 4.3 User Config Format

```json
{
  "userId": "user_abc123",
  "email": "user@example.com",
  "phone": "+15551234567",
  "timezone": "America/Chicago",
  "preferences": {
    "morningStart": "09:00",
    "eveningEnd": "18:00",
    "preferredChannel": "sms",
    "dailySummary": true,
    "dailySummaryTime": "08:00"
  },
  "createdAt": "2025-12-31T00:00:00Z",
  "lastActive": "2025-12-31T16:00:00Z"
}
```

### 4.4 Skill File Format

```markdown
---
name: categorize
version: 1.0
trigger: "new tasks imported or user requests categorization"
---

# Skill: Categorize Tasks

## Purpose
Organize tasks into meaningful categories based on context, location, energy required, and type of work.

## Default Categories
- **work**: Professional tasks, job-related
- **personal**: Personal life, relationships
- **home**: House maintenance, chores
- **errands**: Outside-the-house tasks
- **health**: Exercise, medical, wellness
- **finance**: Money-related tasks
- **learning**: Education, skill development
- **someday**: No urgency, future consideration

## Process
1. Read the task title and any notes
2. Identify keywords and context clues
3. Assign primary category
4. Assign secondary context tags if applicable
5. Estimate energy level (high/medium/low)
6. Estimate duration if not specified

## Examples
- "Call dentist" → health, low energy, 5min
- "Finish Q4 report" → work, high energy, 2hr
- "Buy birthday gift for mom" → personal + errands, medium energy, 30min

## Output
Update the task file with:
- category: primary category
- energy: low | medium | high
- duration: estimated time
- context: array of relevant tags
```

---

## 5. Implementation Guide

### 5.1 Week 1: Foundation

**Goals**: Set up infrastructure, basic file system, user creation

**Fly.io Setup**:
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly apps create vibe-planning-agent

# Create volume for user data
fly volumes create user_data --size 10 --region dfw

# Set secrets
fly secrets set ANTHROPIC_API_KEY=sk-xxx
fly secrets set AGENT_SECRET=xxx  # For Vercel→Fly auth
```

**fly.toml**:
```toml
app = "vibe-planning-agent"
primary_region = "dfw"

[build]
  dockerfile = "Dockerfile"

[mounts]
  source = "user_data"
  destination = "/data"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false  # Keep running for quick response
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

**Dockerfile**:
```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**Key Implementation - Workspace Manager**:
```typescript
// apps/agent/src/filesystem/workspace.ts
import fs from 'fs/promises';
import path from 'path';

const DATA_ROOT = '/data/users';

export class WorkspaceManager {
  private userId: string;
  private basePath: string;

  constructor(userId: string) {
    this.userId = userId;
    this.basePath = path.join(DATA_ROOT, userId);
  }

  async initialize(): Promise<void> {
    // Create directory structure
    const dirs = [
      'meta',
      'inbox',
      'tasks/active',
      'tasks/completed',
      'tasks/someday',
      'context',
      'skills',
      'conversations',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.basePath, dir), { recursive: true });
    }

    // Copy default skills
    await this.copyDefaultSkills();
    
    // Create initial config
    await this.createConfig();
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, relativePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async listDirectory(relativePath: string): Promise<string[]> {
    const fullPath = path.join(this.basePath, relativePath);
    try {
      return await fs.readdir(fullPath);
    } catch {
      return [];
    }
  }

  async searchFiles(query: string): Promise<SearchResult[]> {
    // Recursive search through workspace
    const results: SearchResult[] = [];
    await this.searchRecursive(this.basePath, query, results);
    return results;
  }

  private async searchRecursive(
    dir: string, 
    query: string, 
    results: SearchResult[]
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.searchRecursive(fullPath, query, results);
      } else if (entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            path: fullPath.replace(this.basePath, ''),
            snippet: this.extractSnippet(content, query),
          });
        }
      }
    }
  }

  private extractSnippet(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    return '...' + content.slice(start, end) + '...';
  }

  private async copyDefaultSkills(): Promise<void> {
    const defaultSkillsPath = path.join(process.cwd(), 'skills');
    const skills = await fs.readdir(defaultSkillsPath);
    
    for (const skill of skills) {
      const content = await fs.readFile(
        path.join(defaultSkillsPath, skill), 
        'utf-8'
      );
      await this.writeFile(`skills/${skill}`, content);
    }
  }

  private async createConfig(): Promise<void> {
    const config = {
      userId: this.userId,
      createdAt: new Date().toISOString(),
      preferences: {
        timezone: 'America/Chicago',
        dailySummary: false,
      },
    };
    await this.writeFile('meta/config.json', JSON.stringify(config, null, 2));
  }
}
```

### 5.2 Week 2: Email Integration

**Goals**: SendGrid inbound parsing, email responses

**SendGrid Setup**:
1. Add domain to SendGrid (Domain Authentication)
2. Set up Inbound Parse:
   - Hostname: `tasks.vibeplan.com` (or `@yourdomain.com`)
   - URL: `https://vibeplan.com/api/email/inbound`
   - Check: POST raw MIME, spam check

**DNS Records**:
```
MX  tasks.vibeplan.com  mx.sendgrid.net  10
```

**Email Webhook Handler**:
```typescript
// apps/web/api/email/inbound.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: { bodyParser: false },  // Handle multipart ourselves
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const email = {
      from: extractEmail(formData.get('from') as string),
      to: formData.get('to') as string,
      subject: formData.get('subject') as string,
      text: formData.get('text') as string,
      html: formData.get('html') as string,
    };

    console.log('[Email] Received from:', email.from);

    // Find or create user
    let user = await findUserByEmail(email.from);
    
    if (!user) {
      // Auto-create user on first email
      user = await createUser({ email: email.from });
      console.log('[Email] Created new user:', user.id);
    }

    // Send to agent
    const agentResponse = await fetch(
      `${process.env.FLY_AGENT_URL}/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AGENT_SECRET}`,
        },
        body: JSON.stringify({
          userId: user.id,
          channel: 'email',
          message: email.text || stripHtml(email.html),
          context: {
            subject: email.subject,
          },
        }),
      }
    );

    const result = await agentResponse.json();

    // Send reply via SendGrid
    await sendEmail({
      to: email.from,
      from: 'tasks@vibeplan.com',
      subject: `Re: ${email.subject}`,
      text: result.message,
      html: formatAsHtml(result.message),
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Email] Error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

function extractEmail(from: string): string {
  // "John Doe <john@example.com>" → "john@example.com"
  const match = from.match(/<(.+)>/);
  return match ? match[1] : from;
}
```

### 5.3 Week 3: Agent Core

**Goals**: Claude integration, task parsing, skill execution

**Agent Core**:
```typescript
// apps/agent/src/agent/core.ts
import Anthropic from '@anthropic-ai/sdk';
import { WorkspaceManager } from '../filesystem/workspace';
import { SkillExecutor } from './skills';

const client = new Anthropic();

export class AgentCore {
  private workspace: WorkspaceManager;
  private skills: SkillExecutor;

  constructor(userId: string) {
    this.workspace = new WorkspaceManager(userId);
    this.skills = new SkillExecutor(this.workspace);
  }

  async process(message: string, channel: string, context: any): Promise<AgentResponse> {
    // Build context from workspace
    const workspaceContext = await this.buildContext();
    
    // Get available skills
    const availableSkills = await this.skills.listSkills();

    const systemPrompt = `You are Vibe Planning, an AI task management assistant.

## Your Role
Help users manage their tasks through natural conversation. You operate on a file-based workspace where all tasks are stored as markdown files.

## Current Workspace State
${workspaceContext}

## Available Skills
${availableSkills.map(s => `- ${s.name}: ${s.description}`).join('\n')}

## Tools Available
- read_file: Read any file in the user's workspace
- write_file: Write/update a file
- create_task: Create a new task file
- update_task: Update an existing task
- complete_task: Mark a task as completed
- execute_skill: Run a skill (like categorize or prioritize)
- list_tasks: List tasks by status/category

## Guidelines
1. Be concise but helpful
2. When users send a list of tasks, parse each one and create task files
3. Use the categorize skill for new tasks
4. Match your response to the channel:
   - Email: Can be longer, formatted with markdown
   - SMS: Keep it brief, use plain text
5. Always confirm actions taken
6. If asked "what should I do", use the prioritize skill`;

    const tools = this.getTools();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: [
        { role: 'user', content: `[Channel: ${channel}]\n\n${message}` }
      ],
    });

    // Process tool calls
    const actions: AgentAction[] = [];
    let finalMessage = '';

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await this.executeTool(block.name, block.input);
        actions.push(result.action);
      } else if (block.type === 'text') {
        finalMessage = block.text;
      }
    }

    // If there were tool calls, continue the conversation
    if (response.stop_reason === 'tool_use') {
      // Continue conversation with tool results...
      // (implement tool result handling)
    }

    return {
      success: true,
      message: finalMessage,
      actions,
      metadata: {
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        processingTimeMs: 0, // Calculate from start
        skillsExecuted: actions
          .filter(a => a.type === 'skill_executed')
          .map(a => (a as any).skill),
      },
    };
  }

  private async buildContext(): Promise<string> {
    // Read active tasks
    const activeTasks = await this.workspace.listDirectory('tasks/active');
    const taskCount = activeTasks.length;
    
    // Read user preferences
    let preferences = {};
    try {
      const config = await this.workspace.readFile('meta/config.json');
      preferences = JSON.parse(config).preferences || {};
    } catch {}

    // Get recent tasks for context
    const recentTasks = await this.getRecentTasks(5);

    return `
Active tasks: ${taskCount}
User timezone: ${preferences.timezone || 'Not set'}

Recent tasks:
${recentTasks.map(t => `- ${t.title} [${t.priority}]`).join('\n')}
`;
  }

  private getTools(): Anthropic.Tool[] {
    return [
      {
        name: 'create_task',
        description: 'Create a new task in the workspace',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title' },
            priority: { 
              type: 'string', 
              enum: ['high', 'medium', 'low'],
              description: 'Task priority'
            },
            category: { type: 'string', description: 'Task category' },
            due: { type: 'string', description: 'Due date (ISO 8601)' },
            notes: { type: 'string', description: 'Additional notes' },
          },
          required: ['title'],
        },
      },
      {
        name: 'list_tasks',
        description: 'List tasks, optionally filtered by status or category',
        input_schema: {
          type: 'object',
          properties: {
            status: { 
              type: 'string', 
              enum: ['active', 'completed', 'someday'],
            },
            category: { type: 'string' },
            limit: { type: 'number', default: 10 },
          },
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed',
        input_schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to complete' },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'execute_skill',
        description: 'Execute a skill from the skills folder',
        input_schema: {
          type: 'object',
          properties: {
            skillName: { 
              type: 'string', 
              description: 'Name of skill to execute' 
            },
            params: { 
              type: 'object', 
              description: 'Parameters for the skill' 
            },
          },
          required: ['skillName'],
        },
      },
    ];
  }

  private async executeTool(
    name: string, 
    input: any
  ): Promise<{ result: any; action: AgentAction }> {
    switch (name) {
      case 'create_task':
        return this.createTask(input);
      case 'list_tasks':
        return this.listTasks(input);
      case 'complete_task':
        return this.completeTask(input);
      case 'execute_skill':
        return this.skills.execute(input.skillName, input.params);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async createTask(input: {
    title: string;
    priority?: string;
    category?: string;
    due?: string;
    notes?: string;
  }): Promise<{ result: any; action: AgentAction }> {
    const taskId = `task-${Date.now()}`;
    const now = new Date().toISOString();
    
    const taskContent = `---
id: ${taskId}
title: ${input.title}
status: active
priority: ${input.priority || 'medium'}
category: ${input.category || 'inbox'}
${input.due ? `due: ${input.due}` : ''}
created: ${now}
updated: ${now}
---

# ${input.title}

${input.notes ? `## Notes\n${input.notes}` : ''}
`;

    await this.workspace.writeFile(`tasks/active/${taskId}.md`, taskContent);

    return {
      result: { taskId, title: input.title },
      action: { type: 'task_created', taskId, title: input.title },
    };
  }

  // ... implement other tool methods
}
```

### 5.4 Week 4: SMS Integration

**Goals**: VAPI SMS webhook, quick queries

**VAPI Setup**:
1. Create VAPI account at vapi.ai
2. Create Assistant with webhook URL
3. Purchase phone number
4. Configure SMS settings

**VAPI Webhook Handler**:
```typescript
// apps/web/api/vapi/webhook.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  
  console.log('[VAPI] Webhook:', payload.message?.type);

  // Handle SMS
  if (payload.message?.type === 'conversation-update' && 
      payload.message?.role === 'user') {
    return handleSMS(payload);
  }

  // Handle other event types as needed
  return NextResponse.json({ success: true });
}

async function handleSMS(payload: any) {
  const userPhone = payload.message?.call?.customer?.number;
  const message = payload.message?.content;

  if (!userPhone || !message) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  // Find user by phone
  let user = await findUserByPhone(userPhone);
  
  if (!user) {
    // Handle unknown user
    await sendSMS(
      userPhone, 
      "Welcome! Text your email address to link your Vibe Planning account, or email tasks@vibeplan.com to get started."
    );
    return NextResponse.json({ success: true });
  }

  // Process via agent
  const agentResponse = await fetch(
    `${process.env.FLY_AGENT_URL}/process`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AGENT_SECRET}`,
      },
      body: JSON.stringify({
        userId: user.id,
        channel: 'sms',
        message,
        context: { phoneNumber: userPhone },
      }),
    }
  );

  const result = await agentResponse.json();

  // VAPI handles the response through the assistant
  // Return the message for the assistant to speak/send
  return NextResponse.json({
    success: true,
    response: result.message,
  });
}
```

### 5.5 Week 5: Polish

**Goals**: Error handling, rate limiting, monitoring

**Rate Limiting**:
```typescript
// apps/web/lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 d'),  // 20/day free tier
  prefix: 'ratelimit:email',
});

export const smsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 d'),  // 10/day free tier
  prefix: 'ratelimit:sms',
});
```

**Error Handling Middleware**:
```typescript
// apps/agent/src/middleware/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('[Agent] Error:', err);

  // Specific error types
  if (err.name === 'WorkspaceNotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'User workspace not found',
    });
  }

  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Try again later.',
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    error: 'An error occurred. Please try again.',
  });
}
```

### 5.6 Week 6: Beta Launch

**Goals**: Beta user onboarding, feedback collection

**Onboarding Flow**:
1. User emails tasks@vibeplan.com
2. System creates account, workspace
3. Parses and categorizes initial tasks
4. Replies with organized view + phone number for SMS
5. User links phone number (reply with phone or text email)

**Beta Checklist**:
- [ ] 10 beta users identified
- [ ] Monitoring dashboards set up (Fly.io metrics, Vercel analytics)
- [ ] Error alerting (Sentry or similar)
- [ ] Feedback form/email set up
- [ ] Usage tracking (anonymous)

---

## 6. Environment Variables

```bash
# Vercel (.env.local)
FLY_AGENT_URL=https://vibe-planning-agent.fly.dev
AGENT_SECRET=your-shared-secret

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=tasks@vibeplan.com

# VAPI
VAPI_API_KEY=xxx
VAPI_PHONE_NUMBER=+15551234567

# Auth (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Fly.io (set via fly secrets)
ANTHROPIC_API_KEY=sk-ant-xxx
AGENT_SECRET=your-shared-secret
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=vibe-planning-backups
```

---

## 7. Cost Estimates

| Service | Free Tier | Estimated MVP Cost |
|---------|-----------|-------------------|
| **Vercel** | Hobby (free) | $0 |
| **Fly.io** | $5 credit/mo | ~$10/mo (1 machine + volume) |
| **SendGrid** | 100 emails/day | $0 (free tier) |
| **VAPI** | Pay-as-go | ~$20/mo (estimates) |
| **Claude API** | Pay-as-go | ~$30/mo (1000 requests) |
| **Upstash Redis** | 10k commands/day | $0 (free tier) |
| **Supabase** | Free tier | $0 |
| **Domain** | — | ~$12/year |
| **Total** | — | **~$60-80/mo** |

---

## 8. Testing Strategy

### Unit Tests
- Workspace file operations
- Task parsing and creation
- Skill execution

### Integration Tests
- Email webhook → Agent → Email response
- SMS webhook → Agent → SMS response
- Full user journey (email → SMS → completion)

### Manual Testing Checklist
- [ ] Send email with 10 tasks, verify categorization
- [ ] Reply to adjust categories
- [ ] Text "what should I do?" and get response
- [ ] Text to add new task
- [ ] Text "done with X" to complete
- [ ] Check rate limiting works
- [ ] Check error messages are user-friendly

---

## 9. Launch Checklist

### Infrastructure
- [ ] Fly.io app deployed and healthy
- [ ] Vercel app deployed
- [ ] Domain DNS configured
- [ ] SendGrid domain verified
- [ ] VAPI phone number active
- [ ] R2 bucket created for backups

### Security
- [ ] AGENT_SECRET is strong and rotated
- [ ] API routes have auth checks
- [ ] Rate limiting active
- [ ] No secrets in code/logs

### Monitoring
- [ ] Fly.io metrics dashboard
- [ ] Vercel analytics enabled
- [ ] Error tracking (Sentry) configured
- [ ] Uptime monitoring (optional)

### Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] User guide (how to use email/SMS)

### Beta
- [ ] 10 beta users contacted
- [ ] Feedback mechanism ready
- [ ] Support email monitored
