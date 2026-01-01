# Vibe Planning - Product Requirements Document

## Document Information
- **Product**: Vibe Planning
- **Version**: 1.0
- **Date**: December 31, 2025
- **Status**: Draft

---

## 1. Overview

### 1.1 Product Summary
Vibe Planning is an AI-powered personal task management system accessible via email, SMS, and voice. Users interact with their personal AI assistant through natural language across any channel. The system's "brain" is a file-system-based workspace - a collection of files, skills, and context that the AI operates on, providing unprecedented transparency and portability.

### 1.2 Problem Statement
Current task management tools suffer from:
- **App fatigue**: Users must open yet another app to manage tasks
- **Friction**: Context switching between ideation and task capture
- **Opacity**: AI assistants are black boxes - users can't see or control the underlying data
- **Single-channel**: Most tools require their app; they don't meet users where they are
- **Rigid structure**: Force users into predefined workflows rather than adapting to them

### 1.3 Vision
"Your AI assistant that lives in your inbox, responds to your texts, and picks up your calls - all powered by a transparent file system you own and control."

### 1.4 Goals & Objectives

| Goal | Metric | Target |
|------|--------|--------|
| Reduce task capture friction | Time from thought to captured task | < 30 seconds |
| Multi-channel accessibility | Channels with full feature parity | 3 (email, SMS, voice) |
| User data ownership | Users can export/view their data | 100% transparent |
| AI task intelligence | Tasks auto-categorized correctly | > 85% accuracy |
| User retention | 30-day retention rate | > 40% |

### 1.5 Success Metrics
- **Activation**: User sends first email and receives categorized response
- **Engagement**: Weekly active interactions across any channel
- **Retention**: Continued usage at 7, 14, 30 days
- **NPS**: Net Promoter Score > 50

---

## 2. Core Concept: File System as Brain

### 2.1 Philosophy
Unlike traditional SaaS where data lives in opaque databases, Vibe Planning stores everything as files in a user-owned workspace. This provides:

- **Transparency**: Users can see exactly what the AI knows
- **Portability**: Export your entire "brain" anytime
- **Extensibility**: Add custom skills as files
- **Version control potential**: Track changes over time
- **Offline capability**: Download and work locally

### 2.2 Workspace Structure
```
/user-{id}/
├── inbox/
│   ├── 2025-12-31-email-import.md      # Raw email imports
│   └── 2025-12-31-sms-context.md       # SMS conversation logs
├── tasks/
│   ├── active/
│   │   ├── task-001.md                  # Individual task files
│   │   ├── task-002.md
│   │   └── ...
│   ├── completed/
│   │   └── task-xxx.md
│   └── someday/
│       └── task-xxx.md
├── projects/
│   ├── home-renovation/
│   │   ├── project.md                   # Project metadata
│   │   └── tasks/                       # Project-specific tasks
│   └── q1-goals/
│       └── ...
├── context/
│   ├── preferences.md                   # User preferences, work style
│   ├── schedule.md                      # Known schedule constraints
│   ├── energy-patterns.md               # When user is most productive
│   └── locations.md                     # Common locations, contexts
├── skills/
│   ├── categorize.md                    # How to categorize tasks
│   ├── prioritize.md                    # Prioritization framework
│   ├── daily-planning.md                # Daily planning skill
│   └── weekly-review.md                 # Weekly review skill
├── conversations/
│   ├── 2025-12-31-email-thread.md       # Conversation history
│   └── 2025-12-31-sms-session.md
└── meta/
    ├── config.json                      # System configuration
    └── sync-log.md                      # Sync history
```

### 2.3 Task File Format
```markdown
# Buy groceries for dinner party

- **ID**: task-2025-12-31-001
- **Status**: active
- **Priority**: high
- **Energy**: low
- **Duration**: 45min
- **Context**: errands, car-required
- **Due**: 2025-12-31T17:00:00
- **Project**: dinner-party
- **Created**: 2025-12-31T10:30:00
- **Source**: email

## Notes
Sarah mentioned she's vegetarian - need veggie options.

## Subtasks
- [ ] Check pantry for existing items
- [ ] Make shopping list
- [ ] Go to Whole Foods

## History
- 2025-12-31 10:30 - Created from email import
- 2025-12-31 14:00 - Priority upgraded (deadline approaching)
```

### 2.4 Skills System
Skills are instruction files that teach the AI how to perform specific operations:

```markdown
# Skill: Daily Planning

## Trigger
User asks "what should I do today" or similar

## Inputs Required
- Current time
- User's schedule.md
- User's energy-patterns.md
- Active tasks from tasks/active/

## Process
1. Check calendar commitments (from schedule.md)
2. Identify available time blocks
3. Match tasks to energy levels:
   - Morning (high energy): Deep work, complex tasks
   - Afternoon (medium): Meetings, collaborative work
   - Evening (low): Admin, quick wins
4. Consider contexts (location, tools needed)
5. Limit to 3-5 MIT (Most Important Tasks)

## Output Format
"Here's your plan for today:

**Morning Block (9am-12pm)**
- [ ] [High priority task]
- [ ] [Deep work task]

**Afternoon Block (1pm-5pm)**
- [ ] [Medium tasks]

**If you have extra time:**
- [ ] [Quick wins]

Does this look right, or should I adjust?"
```

---

## 3. User Stories & Jobs to be Done

### 3.1 Primary Personas

**Persona 1: Overwhelmed Professional**
- 30-45 years old, knowledge worker
- Constantly context-switching
- Uses email heavily for work
- Feels underwater with tasks
- *"I have 100 things to do and no system that sticks"*

**Persona 2: Mobile-First Parent**
- 28-40 years old, busy parent
- Phone is primary device
- Rarely sits at computer for personal tasks
- Needs quick capture, quick retrieval
- *"I think of things while driving/cooking and forget them"*

**Persona 3: Voice-Preference User**
- Any age, hands-free preference
- Dislikes typing
- Comfortable talking to AI
- May have accessibility needs
- *"Just let me tell you what I need to do"*

### 3.2 Jobs to be Done

| When... | I want to... | So I can... |
|---------|--------------|-------------|
| I'm overwhelmed with a brain dump | Email my entire list | Get it organized without effort |
| I'm out running errands | Text "what should I do here?" | Knock out nearby tasks |
| I'm starting my day | Ask "what's most important?" | Focus on what matters |
| I'm driving | Call and add a task | Capture without typing |
| I have 15 minutes free | Ask "quick wins?" | Make progress on something |
| I complete something | Say "done with X" | Keep my list current |
| I want to review my week | Email "weekly review" | See what I accomplished |

### 3.3 User Flows

**Flow 1: Initial Onboarding (Email)**
```
User → Emails tasks@vibeplan.com with subject "My tasks"
       Body: "Here's everything I need to do:
       - Call dentist
       - Finish Q1 report
       - Buy birthday gift for mom
       - Research vacation spots
       - Fix leaky faucet
       - Review team proposals
       ..."

System → Creates user workspace
      → Parses email, creates task files
      → Runs categorize.md skill
      → Runs prioritize.md skill
      → Replies with organized view:
      
      "Welcome to Vibe Planning! I've organized your 47 tasks:
      
      **Work (12 tasks)**
      - Finish Q1 report [HIGH - deadline approaching]
      - Review team proposals
      ...
      
      **Personal (8 tasks)**
      ...
      
      **Home (5 tasks)**
      ...
      
      **Someday/Maybe (22 tasks)**
      ...
      
      Reply to adjust, or text me at (XXX) XXX-XXXX for quick access."
```

**Flow 2: Quick SMS Query**
```
User → Texts: "what 3 things should I do right now?"

System → Reads context (time, day, recent activity)
      → Reads active tasks
      → Applies prioritize.md skill
      → Responds:
      
      "Based on your energy patterns (afternoon = admin), here are 3 quick wins:
      
      1. Call dentist (5 min, phone)
      2. Reply to Sarah's email (10 min, phone)  
      3. Order mom's birthday gift (15 min, phone)
      
      All doable from your phone right now. Say 'done' when you finish one!"
```

**Flow 3: Voice Capture**
```
User → Calls VAPI number
Voice → "What can I help you with?"

User → "Add a task: I need to remember to pick up dry cleaning tomorrow before 6pm"

Voice → Creates task file with:
       - Title: Pick up dry cleaning
       - Due: Tomorrow 6pm
       - Context: errands
       
       "Got it! I've added 'Pick up dry cleaning' due tomorrow by 6pm. Anything else?"
```

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INBOUND CHANNELS                            │
├──────────────────┬──────────────────┬───────────────────────────────┤
│    SendGrid      │     VAPI         │    Mobile App                 │
│  (Inbound Email) │  (Voice + SMS)   │  (React Native)               │
└────────┬─────────┴────────┬─────────┴──────────────┬────────────────┘
         │                  │                        │
         ▼                  ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE FUNCTIONS                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │ /api/email  │ │ /api/voice  │ │ /api/sms    │ │ /api/app      │  │
│  │  webhook    │ │  webhook    │ │  webhook    │ │  endpoints    │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └───────┬───────┘  │
│         │               │               │                │          │
│         └───────────────┴───────────────┴────────────────┘          │
│                                 │                                   │
│                                 ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    UNIFIED AGENT CORE                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │   │
│  │  │ Message     │ │ Context     │ │ Skill                   │ │   │
│  │  │ Parser      │ │ Builder     │ │ Executor                │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │              Claude / Agent SDK                         │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PERSISTENT FILE SYSTEM                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │   Option A: Fly.io Volumes    │   Option B: Modal Volumes    │   │
│  │   - Persistent disk per user  │   - Ephemeral + S3 sync      │   │
│  │   - Direct file access        │   - Scale to zero            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Alternative: Cloudflare R2 + Durable Objects (edge-native)         │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       OUTBOUND CHANNELS                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │  SendGrid   │ │    VAPI     │ │    VAPI     │ │  Push         │  │
│  │  (Email)    │ │   (Voice)   │ │   (SMS)     │ │  Notifications│  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Hosting** | Vercel | Edge functions, easy deployment, scales well |
| **Email** | SendGrid | Inbound parsing, reliable delivery, webhooks |
| **Voice/SMS** | VAPI | Unified voice + SMS, AI-native, good DX |
| **AI Core** | Claude + Agent SDK | Best reasoning, tool use, structured output |
| **File Storage** | Fly.io Volumes | Persistent disk, low latency, simple |
| **Mobile App** | React Native + Expo | Cross-platform, App Store ready |
| **Auth** | Supabase Auth | Simple, integrates with existing stack |
| **Background Jobs** | Vercel Cron + Inngest | Scheduled tasks, reliable execution |

### 4.3 Storage Architecture Decision

**Recommended: Fly.io Volumes + S3 Backup**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Fly.io Application                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Agent Container                        │  │
│  │  - Runs Claude SDK                                        │  │
│  │  - Direct file system access                              │  │
│  │  - Low latency reads/writes                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Fly Volume                             │  │
│  │  /data/users/{user-id}/                                   │  │
│  │    ├── tasks/                                             │  │
│  │    ├── skills/                                            │  │
│  │    └── ...                                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    (async backup every N minutes)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    S3 / Cloudflare R2                           │
│  - Durable backup                                               │
│  - User export downloads                                        │
│  - Disaster recovery                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Why Fly.io:**
- True persistent volumes (not ephemeral)
- Sub-millisecond file access
- Simple deployment model
- Can run long-lived containers (agent sessions)
- Affordable for indie scale

**Alternative Considered - Modal:**
- Better for compute-heavy workloads
- Ephemeral by default (requires explicit persistence)
- Great for batch processing, less ideal for persistent state

### 4.4 API Design

**Webhook Endpoints (Vercel)**

```typescript
// POST /api/email/inbound
// SendGrid Inbound Parse webhook
interface EmailWebhook {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: Attachment[];
}

// POST /api/vapi/webhook  
// VAPI webhook for voice/SMS
interface VAPIWebhook {
  type: 'call_started' | 'speech_update' | 'call_ended' | 'sms_received';
  call?: CallData;
  message?: MessageData;
}

// POST /api/app/sync
// Mobile app sync endpoint
interface SyncRequest {
  userId: string;
  lastSyncTimestamp: string;
  changes: FileChange[];
}
```

**Agent Communication (Fly.io)**

```typescript
// Vercel → Fly.io (via REST or WebSocket)
interface AgentRequest {
  userId: string;
  channel: 'email' | 'sms' | 'voice' | 'app';
  message: string;
  context: {
    conversationId?: string;
    replyTo?: string;
  };
}

interface AgentResponse {
  message: string;
  actions: Action[];  // File operations performed
  followUp?: {
    channel: 'email' | 'sms' | 'voice';
    delay?: number;
  };
}
```

---

## 5. MVP Specification

### 5.1 MVP Scope

**In Scope (Phase 1)**
- [ ] Email inbound: Receive and parse emails
- [ ] Email outbound: Send responses
- [ ] Task parsing: Extract tasks from natural language
- [ ] Task categorization: Auto-organize by context
- [ ] Task storage: File-based workspace
- [ ] Basic skills: Categorize, prioritize, daily planning
- [ ] SMS inbound/outbound via VAPI
- [ ] Web dashboard (view-only initially)

**Out of Scope (Phase 1)**
- Voice calling (Phase 2)
- Mobile app (Phase 2)
- Calendar integration (Phase 2)
- Team/shared workspaces (Phase 3)
- Custom skill creation UI (Phase 3)

### 5.2 MVP User Journey

```
Week 1: Onboarding
├── Day 1: User emails brain dump → Gets organized response
├── Day 2-3: User replies to adjust/add → System learns preferences
└── Day 4-7: User starts texting for quick queries

Week 2-4: Habit Formation  
├── Daily: Morning text "what should I focus on?"
├── Throughout day: Quick adds via SMS
├── Evening: Email with daily summary (opt-in)
└── Weekly: Email with weekly review
```

### 5.3 MVP Technical Requirements

**Email (SendGrid)**
```yaml
Inbound:
  - Parse webhook at /api/email/inbound
  - Extract sender, subject, body
  - Handle attachments (store in workspace)
  - Support threading (In-Reply-To header)

Outbound:
  - Send from tasks@vibeplan.com
  - Maintain threading
  - Rate limit: 100/day free tier
```

**SMS (VAPI)**
```yaml
Inbound:
  - Webhook at /api/vapi/sms
  - Parse message content
  - Identify user by phone number

Outbound:  
  - Send responses via VAPI API
  - Support MMS for rich content (optional)
  - Rate limit: TBD by VAPI plan
```

**Agent Core**
```yaml
Model: Claude 3.5 Sonnet (or Haiku for simple queries)
Context Window: 
  - Load relevant workspace files
  - Last N messages in conversation
  - Applicable skills

Tools:
  - read_file(path) → string
  - write_file(path, content) → void
  - list_files(directory) → string[]
  - search_files(query) → FileMatch[]
  - execute_skill(skill_name, params) → SkillResult
```

### 5.4 MVP File Operations

```typescript
// Core file operations the agent can perform
interface FileSystem {
  // Read a file from user's workspace
  readFile(userId: string, path: string): Promise<string>;
  
  // Write/update a file
  writeFile(userId: string, path: string, content: string): Promise<void>;
  
  // List directory contents
  listDirectory(userId: string, path: string): Promise<string[]>;
  
  // Search across files
  searchFiles(userId: string, query: string): Promise<SearchResult[]>;
  
  // Create new task file
  createTask(userId: string, task: TaskInput): Promise<string>;
  
  // Update task status
  updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<void>;
}
```

### 5.5 MVP Milestones

| Milestone | Deliverables | Timeline |
|-----------|--------------|----------|
| **M1: Foundation** | Fly.io setup, basic file system, user workspaces | Week 1 |
| **M2: Email** | SendGrid integration, inbound parsing, outbound | Week 2 |
| **M3: Agent** | Claude integration, skill execution, task CRUD | Week 3 |
| **M4: SMS** | VAPI integration, quick queries | Week 4 |
| **M5: Polish** | Error handling, rate limiting, monitoring | Week 5 |
| **M6: Beta** | Beta user onboarding, feedback loop | Week 6 |

---

## 6. Mobile App Strategy

### 6.1 App Store Requirements

**iOS App Store**
- Apple Developer Account ($99/year)
- App Review Guidelines compliance
- Privacy Policy and Terms of Service
- Data handling disclosure (App Privacy labels)
- In-App Purchase for subscriptions (30% Apple cut)

**Google Play Store**
- Google Play Developer Account ($25 one-time)
- Content rating questionnaire
- Privacy Policy
- Data safety section
- Google Play Billing for subscriptions (15-30% cut)

### 6.2 App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native + Expo                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Screens                                                   │  │
│  │ ├── Inbox (task list)                                     │  │
│  │ ├── Task Detail                                           │  │
│  │ ├── Quick Add (voice/text input)                          │  │
│  │ ├── Workspace Browser (file explorer)                     │  │
│  │ └── Settings                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Local Storage (SQLite/AsyncStorage)                       │  │
│  │ - Cached tasks for offline                                │  │
│  │ - Pending changes queue                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Sync Engine                                               │  │
│  │ - Background sync with Fly.io                             │  │
│  │ - Conflict resolution (last-write-wins or merge)          │  │
│  │ - Offline queue for changes                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Key App Features

| Feature | Priority | MVP? |
|---------|----------|------|
| View tasks | High | Phase 2 |
| Quick add (text) | High | Phase 2 |
| Quick add (voice) | Medium | Phase 2 |
| Browse workspace files | Medium | Phase 2 |
| Offline mode | Medium | Phase 2 |
| Push notifications | High | Phase 2 |
| Widget (iOS/Android) | Low | Phase 3 |
| Watch app | Low | Phase 3 |

---

## 7. Integration Specifications

### 7.1 SendGrid Setup

```yaml
Domain: vibeplan.com (or your domain)
MX Records: 
  - mx.sendgrid.net (priority 10)

Inbound Parse:
  URL: https://vibeplan.com/api/email/inbound
  Hostname: tasks.vibeplan.com (or @vibeplan.com)
  Check: POST raw, full MIME
  
API Keys:
  - SENDGRID_API_KEY (for sending)
  - Webhook verification (optional but recommended)
```

**Inbound Webhook Handler:**
```typescript
// /api/email/inbound.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  
  const email = {
    from: formData.get('from') as string,
    to: formData.get('to') as string,
    subject: formData.get('subject') as string,
    text: formData.get('text') as string,
    html: formData.get('html') as string,
  };
  
  // Identify user by email
  const user = await findUserByEmail(email.from);
  if (!user) {
    // New user - create account or reject
    return new Response('Unknown sender', { status: 200 });
  }
  
  // Forward to agent on Fly.io
  const response = await fetch(`${FLY_AGENT_URL}/process`, {
    method: 'POST',
    body: JSON.stringify({
      userId: user.id,
      channel: 'email',
      message: email.text,
      context: { subject: email.subject }
    })
  });
  
  const result = await response.json();
  
  // Send reply via SendGrid
  await sendEmail({
    to: email.from,
    from: 'tasks@vibeplan.com',
    subject: `Re: ${email.subject}`,
    text: result.message
  });
  
  return new Response('OK', { status: 200 });
}
```

### 7.2 VAPI Setup

```yaml
Account: VAPI.ai account
Phone Number: Purchase via VAPI dashboard

Assistant Configuration:
  Name: Vibe Planning Assistant
  Model: Claude 3.5 Sonnet
  Voice: Default or custom ElevenLabs
  First Message: "Hey! What can I help you with?"
  
Webhooks:
  Server URL: https://vibeplan.com/api/vapi/webhook
  Events: 
    - call_started
    - speech_update  
    - call_ended
    - sms_received
```

**VAPI Webhook Handler:**
```typescript
// /api/vapi/webhook.ts
export async function POST(req: NextRequest) {
  const event = await req.json();
  
  switch (event.type) {
    case 'sms_received':
      return handleSMS(event);
    case 'call_started':
      return handleCallStart(event);
    case 'speech_update':
      return handleSpeech(event);
    case 'call_ended':
      return handleCallEnd(event);
  }
}

async function handleSMS(event: VAPIEvent) {
  const { from, message } = event;
  
  // Identify user by phone
  const user = await findUserByPhone(from);
  if (!user) {
    return sendSMS(from, "Text START to create your Vibe Planning account!");
  }
  
  // Process via agent
  const response = await processWithAgent(user.id, 'sms', message);
  
  // Reply via VAPI
  await sendSMS(from, response.message);
}
```

### 7.3 Fly.io Setup

```yaml
# fly.toml
app = "vibe-planning-agent"
primary_region = "dfw"  # Dallas (or nearest to users)

[build]
  dockerfile = "Dockerfile"

[mounts]
  source = "user_data"
  destination = "/data"

[env]
  NODE_ENV = "production"
  
[http_service]
  internal_port = 3000
  force_https = true
  
[[services]]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

**Volume Setup:**
```bash
# Create persistent volume
fly volumes create user_data --size 10 --region dfw

# Deploy
fly deploy
```

---

## 8. Security & Privacy

### 8.1 Data Handling

| Data Type | Storage | Encryption | Retention |
|-----------|---------|------------|-----------|
| User credentials | Supabase Auth | At rest | Until deletion |
| Task files | Fly.io Volume | At rest (volume encryption) | Until user deletion |
| Email content | Processed, not stored raw | In transit (TLS) | Extracted to tasks |
| SMS logs | Conversation files | At rest | 90 days |
| Voice transcripts | Conversation files | At rest | 90 days |

### 8.2 Privacy Principles

1. **User owns their data**: Full export available anytime
2. **Minimal retention**: Only keep what's needed for functionality
3. **No selling data**: Never monetize user data
4. **Transparent AI**: User can see exactly what AI knows (file system)
5. **Delete means delete**: Account deletion removes all data

### 8.3 Compliance

- **GDPR**: Right to access, right to deletion, data portability
- **CCPA**: California consumer privacy rights
- **App Store**: Apple/Google privacy requirements

---

## 9. Business Model

### 9.1 Pricing Tiers

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| **Free** | $0/mo | 50 tasks, 20 emails/day, 10 SMS/day | Core features |
| **Pro** | $9/mo | Unlimited tasks, 100 emails/day, 50 SMS/day | + Voice, + Priority support |
| **Team** | $19/user/mo | Unlimited | + Shared workspaces, + Admin controls |

### 9.2 Cost Structure (Estimated)

| Service | Free Tier | Paid Estimate |
|---------|-----------|---------------|
| Vercel | Free (hobby) | $20/mo (pro) |
| Fly.io | Free tier | $5-20/mo |
| SendGrid | 100/day free | $15/mo (40k emails) |
| VAPI | Pay-as-go | ~$0.05/min voice, ~$0.01/SMS |
| Claude API | Pay-as-go | ~$3/1M input tokens |
| Supabase | Free tier | $25/mo |

**Estimated cost per active user**: $0.50-2.00/mo

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Email deliverability issues | High | Medium | SPF/DKIM/DMARC setup, warm-up sending |
| VAPI downtime | Medium | Low | Queue messages, retry logic |
| AI hallucination | Medium | Medium | Structured outputs, validation |
| User data loss | Critical | Low | Hourly backups to S3 |
| Cost overrun (AI tokens) | Medium | Medium | Token budgets, caching, smaller models for simple queries |
| App Store rejection | High | Medium | Follow guidelines strictly, beta test |

---

## 11. Success Criteria

### 11.1 MVP Success (6 weeks)
- [ ] 10 beta users actively using email + SMS
- [ ] < 5 second response time for SMS queries
- [ ] > 80% task categorization accuracy (user feedback)
- [ ] Zero data loss incidents

### 11.2 Phase 2 Success (3 months)
- [ ] 100 paying users
- [ ] Mobile app live on both stores
- [ ] Voice calling functional
- [ ] < 2% churn rate

### 11.3 Phase 3 Success (6 months)
- [ ] 1,000 active users
- [ ] Revenue covering costs (break-even)
- [ ] Custom skills feature launched
- [ ] Team workspaces in beta

---

## Appendix A: Competitive Analysis

| Product | Strengths | Weaknesses | Differentiation |
|---------|-----------|------------|-----------------|
| **Todoist** | Mature, cross-platform | App-centric, no AI | We're channel-native (email/SMS first) |
| **Things 3** | Beautiful UX | Apple only, no AI | We're everywhere |
| **Notion** | Flexible, databases | Complex, app required | We're simple, AI-first |
| **Superhuman** | Email-native | Email only, $30/mo | We do tasks, not email |
| **Mem.ai** | AI-powered | Opaque, app-centric | We're transparent (file system) |

**Our unique position**: The only AI task manager that's email/SMS-first with a transparent file-system backend you own.

---

## Appendix B: Technical Glossary

| Term | Definition |
|------|------------|
| **Workspace** | User's personal file system containing all their data |
| **Skill** | An instruction file that teaches the AI how to perform a specific operation |
| **Channel** | Communication method (email, SMS, voice, app) |
| **Context file** | Metadata about user preferences, schedule, patterns |
| **Task file** | Markdown file representing a single task with structured frontmatter |

---

## Appendix C: Open Questions

1. **Identity**: How do we handle users with multiple email addresses or phone numbers?
2. **Onboarding**: Should first contact require explicit signup, or auto-create accounts?
3. **Pricing**: Is $9/mo the right price point for Pro?
4. **Skills marketplace**: Should users be able to share/sell custom skills?
5. **Integrations**: Calendar sync priority? (Google Calendar, Apple Calendar, Outlook)
