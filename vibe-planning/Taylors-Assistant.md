# Comprehensive Breakdown: Taylor's Assistant Documentation

Your OpenCode agent has generated two comprehensive planning documents for **Taylor's Assistant** - an AI-powered task management system for Taylor Brown. The documents were created using a "vibe planning" methodology after extensive discussion about Taylor's needs and motivations.

## Overview

**Taylor's Assistant** is an AI assistant that operates through email, SMS, and voice channels, with a unique transparent file-system workspace that users actually own. The killer feature is that all data lives as readable markdown files rather than in opaque databases - giving users complete visibility into what the AI knows.

---

## Document #1: PRD.md - The Strategic Blueprint

### What Problem It Solves

The PRD identifies five pain points with existing task managers:
- **App fatigue**: Users must open yet another app to manage tasks
- **Friction**: Context switching between ideation and task capture
- **Opacity**: AI assistants are black boxes - users can't see or control underlying data
- **Single-channel**: Most tools require their app; they don't meet users where they are
- **Rigid structure**: Force users into predefined workflows rather than adapting to them

Taylor's Assistant addresses these by meeting users where they already are (inbox, texts, calls) instead of forcing another app into their lives.

### Key Innovation: File-System-as-Brain

Every user gets a personal workspace with this structure:

```
/user-{id}/
├── inbox/              # Raw email imports and SMS logs
├── tasks/
│   ├── active/         # Individual task files as markdown
│   ├── completed/      
│   └── someday/        
├── projects/           # Project-specific task collections
├── context/
│   ├── preferences.md  # User preferences, work style
│   ├── schedule.md     # Known schedule constraints
│   ├── energy-patterns.md  # When user is most productive
│   └── locations.md    # Common locations, contexts
├── skills/
│   ├── categorize.md   # How to categorize tasks
│   ├── prioritize.md   # Prioritization framework
│   ├── daily-planning.md
│   └── weekly-review.md
├── conversations/      # Full interaction history
└── meta/
    ├── config.json     # System configuration
    └── sync-log.md     # Sync history
```

**Why This Matters**:
- **Transparency**: Users can see exactly what the AI knows
- **Portability**: Export your entire "brain" anytime
- **Extensibility**: Add custom skills as files
- **Version control potential**: Track changes over time
- **Offline capability**: Download and work locally

### Task File Format

Each task is a standalone markdown file with YAML frontmatter:

```markdown
---
id: task-2025-12-31-001
title: Buy groceries for dinner party
status: active
priority: high
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

### Target Personas

Three primary users identified:

1. **Overwhelmed Professional**
   - 30-45 years old, knowledge worker
   - Constantly context-switching
   - Uses email heavily for work
   - Feels underwater with tasks
   - *"I have 100 things to do and no system that sticks"*

2. **Mobile-First Parent**
   - 28-40 years old, busy parent
   - Phone is primary device
   - Rarely sits at computer for personal tasks
   - Needs quick capture, quick retrieval
   - *"I think of things while driving/cooking and forget them"*

3. **Voice-Preference User**
   - Any age, hands-free preference
   - Dislikes typing
   - Comfortable talking to AI
   - May have accessibility needs
   - *"Just let me tell you what I need to do"*

### Jobs to be Done

| When... | I want to... | So I can... |
|---------|--------------|-------------|
| I'm overwhelmed with a brain dump | Email my entire list | Get it organized without effort |
| I'm out running errands | Text "what should I do here?" | Knock out nearby tasks |
| I'm starting my day | Ask "what's most important?" | Focus on what matters |
| I'm driving | Call and add a task | Capture without typing |
| I have 15 minutes free | Ask "quick wins?" | Make progress on something |
| I complete something | Say "done with X" | Keep my list current |
| I want to review my week | Email "weekly review" | See what I accomplished |

### User Flow Example: Initial Onboarding

```
User → Emails tasks@taylorsassistant.com with subject "My tasks"
       Body: "Here's everything I need to do:
       - Call dentist
       - Finish Q4 report
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
      
      "Welcome to Taylor's Assistant! I've organized your 47 tasks:
      
      **Work (12 tasks)**
      - Finish Q4 report [HIGH - deadline approaching]
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

### Business Model

Freemium pricing with thoughtful limits:

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| **Free** | $0/mo | 50 tasks, 20 emails/day, 10 SMS/day | Core features |
| **Pro** | $9/mo | Unlimited tasks, 100 emails/day, 50 SMS/day | + Voice, + Priority support |
| **Team** | $19/user/mo | Unlimited | + Shared workspaces, + Admin controls |

**Estimated cost per active user**: $0.50-2.00/mo

---

## Document #2: MVP-SPEC.md - The Technical Execution Plan

### Architecture Overview

The MVP spec delivers a **6-week, ~$100/mo infrastructure** implementation.

#### Three-Tier Architecture

```
                              ┌─────────────────────┐
                              │    Your Domain      │
                              │ (taylorsassistant   │
                              │      .com)          │
                              └──────────┬──────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐            ┌─────────────────┐
│    SendGrid     │           │     Vercel      │            │      VAPI       │
│  Inbound Parse  │           │  Edge Functions │            │    Voice/SMS    │
│                 │           │                 │            │                 │
│ MX: tasks.      │──────────▶│ /api/email      │◀───────────│ Webhook to      │
│ domain.com      │           │ /api/vapi       │            │ /api/vapi       │
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

### Tech Stack

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

### Repository Structure

```
taylors-assistant/
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

### API Contracts

#### Vercel → Fly.io Agent

```typescript
// POST https://taylors-assistant-agent.fly.dev/process
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

### Skills System

Skills are markdown instruction files that teach the AI how to perform specific operations. Example **categorize.md** skill:

```markdown
---
name: categorize
version: 1.0
trigger: "new tasks imported or user requests categorization"
---

# Skill: Categorize Tasks

## Purpose
Organize tasks into meaningful categories based on context, location, 
energy required, and type of work.

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

### Technical Highlights

**File System Operations**:
The agent exposes clean primitives via the WorkspaceManager class:
- `initialize()` - Creates user workspace directory structure
- `readFile(path)` - Read any file in workspace
- `writeFile(path, content)` - Write/update files
- `listDirectory(path)` - List directory contents
- `searchFiles(query)` - Full-text search across workspace
- `createTask(input)` - Generate task file with frontmatter
- `updateTask(taskId, updates)` - Modify existing tasks

**Agent Core Integration**:
Claude SDK with custom tools:
- `create_task` - Create new task in workspace
- `list_tasks` - List tasks with filters
- `complete_task` - Mark task as completed
- `execute_skill` - Run a skill file against current context

**Data Flow Example**:
```
User emails brain dump 
  → SendGrid webhook 
  → Vercel /api/email/inbound
  → Fly.io agent processes via Claude
  → Creates task files in /data/users/{userId}/tasks/active/
  → Runs categorize.md skill
  → Emails back organized view via SendGrid
```

### Implementation Timeline: 6-Week Sprint

| Milestone | Deliverables | Week |
|-----------|--------------|------|
| **M1: Foundation** | Fly.io setup, basic file system, user workspaces | 1 |
| **M2: Email** | SendGrid integration, inbound parsing, outbound | 2 |
| **M3: Agent** | Claude integration, skill execution, task CRUD | 3 |
| **M4: SMS** | VAPI integration, quick queries | 4 |
| **M5: Polish** | Error handling, rate limiting, monitoring | 5 |
| **M6: Beta** | Beta user onboarding, feedback loop | 6 |

#### Week 1: Foundation
- Set up Fly.io app and persistent volume
- Implement WorkspaceManager class
- Create default skill files (categorize, prioritize, daily-planning)
- User creation and workspace initialization

#### Week 2: Email Integration
- Configure SendGrid domain authentication
- Set up MX records for inbound parse
- Implement webhook handler at /api/email/inbound
- Outbound email responses with threading support

#### Week 3: Agent Core
- Integrate Claude SDK with tool definitions
- Build AgentCore class with message processing
- Implement skill executor
- Task CRUD operations on file system

#### Week 4: SMS Integration
- Set up VAPI account and phone number
- Configure SMS webhook at /api/vapi/webhook
- Handle SMS-specific message formatting
- Quick query patterns ("what should I do?")

#### Week 5: Polish
- Error handling middleware
- Rate limiting (Upstash Redis)
- Monitoring dashboards (Fly.io metrics, Vercel analytics)
- Backup sync to Cloudflare R2

#### Week 6: Beta Launch
- Onboard 10 beta users
- Feedback collection mechanism
- Usage tracking (anonymous)
- Support email monitoring

### Infrastructure Costs

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

### Code Samples Provided

The MVP spec includes production-ready TypeScript implementations:

1. **WorkspaceManager** - Complete file system operations class
2. **AgentCore** - Claude SDK integration with tool execution
3. **Email webhook handler** - SendGrid inbound parsing
4. **VAPI webhook handler** - SMS message processing
5. **Fly.io configuration** - fly.toml and Dockerfile
6. **Rate limiting** - Upstash Redis implementation

### Phase 2 Features (Post-MVP)

Explicitly excluded from MVP, planned for later:
- Voice calling integration
- React Native mobile app
- Calendar sync (Google, Apple, Outlook)
- Custom skills UI builder
- Team workspaces and collaboration
- Advanced AI features (proactive suggestions, habit tracking)

---

## What Makes This Strong

### For Taylor Brown's Context

1. **Technical Philosophy Alignment**: The transparent file system matches Taylor's deep technical background and preference for inspectable systems (consistent with his INTJ/INTP analytical orientation).

2. **Email-First Design**: Given Taylor's role as Technical Fellow at YNAB, email is likely a primary communication channel. The system meets him where he already works.

3. **File-Based Ownership**: As someone who built YNAB's core products, Taylor would appreciate user data sovereignty and the ability to version control his own task system.

4. **Extensible Skills**: The markdown-based skills system allows Taylor to customize behavior without writing code - he can iterate on instructions as files.

### Technical Soundness

**Realistic Scope**: 
- 6-week MVP focuses on core value (email + SMS) without overcommitting
- Each week has clear deliverables and dependencies
- Phase 2 features appropriately deferred

**Pragmatic Stack**:
- Uses proven, cost-effective tools (Vercel, Fly.io, Claude)
- Avoids exotic technologies that increase risk
- Free tiers cover initial beta testing
- Clear upgrade path for scaling

**Observable System**:
- File-based storage makes debugging straightforward
- User can inspect their own workspace
- Conversation history preserved in readable format
- Easy to export/backup entire user state

**Incremental Complexity**:
- Can start with email-only and layer in SMS/voice
- Skills system allows behavior changes without code deploys
- Monorepo structure supports independent app deployment

### Architectural Highlights

**Separation of Concerns**:
- Vercel handles edge/webhook routing (stateless)
- Fly.io handles agent computation (stateful)
- R2 handles backups (durable storage)

**Claude SDK Integration**:
- Well-defined tool interface for file operations
- Skills as context injection rather than hardcoded logic
- Structured output for reliable parsing

**Multi-Channel Design**:
- Unified agent core processes all channels identically
- Channel-specific formatting in edge functions
- Same workspace regardless of entry point

---

## Potential Concerns & Considerations

### Rate Limiting on Free Tiers
**SendGrid**: 100 emails/day could be restrictive for power users during beta testing. Consider:
- Implementing user-facing limits clearly in onboarding
- Upgrade prompts when approaching limits
- Priority queue for paid users

### File System Performance
The spec assumes direct disk access is fast enough for real-time responses. You may need:
- In-memory caching for frequently accessed tasks
- Indexing for search operations on large workspaces
- Background jobs for expensive operations (weekly reviews)

### Identity Management
The PRD notes an open question: how to handle users with multiple email addresses or phone numbers? Consider:
- Primary identity with linked addresses
- Account merging flow
- Clear communication about which channels are linked

### Data Privacy & Security
While the docs mention encryption at rest and in transit, consider:
- GDPR/CCPA compliance requirements
- User data deletion workflows
- Encryption key management
- Audit logging for sensitive operations

### Claude API Costs
At scale, AI costs could become significant. Strategies:
- Use Claude Haiku for simple queries (categorization)
- Cache skill outputs when possible
- Implement token budgets per user tier
- Consider fallback to GPT-4o-mini for cost optimization

### Skill Instruction Quality
The system's intelligence depends on well-written skills. Consider:
- Version control for default skills
- A/B testing skill variations
- User feedback loop on skill accuracy
- Community-contributed skills (with moderation)

---

## Next Steps for Implementation

### Immediate Actions

1. **Validate with Taylor**: 
   - Confirm the problem statement resonates with his actual pain points
   - Discuss the file-system transparency approach
   - Review pricing model against his expectations

2. **Review Repository Structure**:
   - Check if [apps/](https://github.com/claybowl/Taygency/tree/main/apps) matches proposed architecture
   - Verify monorepo setup (Turbo, package structure)
   - Ensure TypeScript configuration is aligned

3. **Prioritize Open Questions** (from PRD Appendix C):
   - Identity: How to handle multiple email/phone per user?
   - Onboarding: Auto-create accounts or require signup?
   - Pricing: Is $9/mo the right price point?
   - Integrations: Calendar sync priority?
   - Skills marketplace: Should users share/sell skills?

4. **Start Week 1 Implementation**:
   - Set up Fly.io app: `fly apps create taylors-assistant-agent`
   - Create persistent volume: `fly volumes create user_data --size 10`
   - Implement WorkspaceManager class
   - Build default skill files

### Technical Preparation

**Environment Setup**:
```bash
# Required accounts
- Vercel account (deploy web app)
- Fly.io account (deploy agent)
- SendGrid account (email)
- VAPI account (SMS/voice)
- Anthropic API key (Claude)
- Supabase project (auth)

# Domain configuration
- Purchase domain or use subdomain
- Configure DNS records for SendGrid MX
- Set up SSL certificates
```

**Repository Initialization**:
```bash
# Clone and set up monorepo
git clone https://github.com/claybowl/Taygency.git
cd Taygency/taylors-assistant  # Or wherever project lives
npm install

# Set up environment variables (from .env.example)
cp .env.example .env
# Fill in API keys and secrets
```

### Beta Testing Strategy

**Target Beta Users** (10 people):
- 3-4 technical professionals (similar to Taylor's profile)
- 3-4 mobile-first users (parents, busy professionals)
- 2-3 accessibility-focused users (voice preference)

**Beta Success Criteria**:
- All users complete onboarding (email brain dump → organized response)
- 70%+ daily active usage in first week
- < 5 second response time for SMS queries
- > 80% task categorization accuracy (user feedback)
- Zero data loss incidents

**Feedback Collection**:
- Weekly check-in emails
- In-app feedback form (simple textarea)
- Usage analytics (anonymous)
- Direct user interviews (2-3 users)

---

## Alignment with Taylor Brown's Context

### Why This Project Fits Taylor

**Professional Background**:
- As YNAB's Technical Fellow and longtime CTO, Taylor has deep experience building user-facing products that require trust and reliability
- The transparent file system approach mirrors YNAB's philosophy of user empowerment and data ownership
- Email/SMS-first aligns with how technical leaders actually work (async, multi-channel)

**Working Style** (based on INTJ/INTP patterns):
- Likely appreciates systems that are inspectable and logically structured
- Values autonomy and control over tools rather than opaque services
- Long-term thinking: file-based system is future-proof and portable
- Craftsmanship orientation: the elegant simplicity of markdown files for complex task management

**Technical Leverage**:
- Taylor can customize skills without code changes
- Can experiment with AI prompting via markdown files
- File system can be version controlled (Git)
- Easy to extend with custom tooling (scripts, integrations)

### Connection to VibeNative/Agentic OS Concepts

The project appears connected to broader "Agentic OS" thinking (per the uploaded PDF):
- **Observable runtime**: File system makes all state visible
- **User-owned data**: Workspace belongs to user, not platform
- **Inspectable intelligence**: Skills are readable instruction files
- **Workflows as files**: Tasks and skills are version-controllable artifacts

Taylor's Assistant could be a practical implementation of these principles in the personal productivity domain.

---

## Summary

Your OpenCode agent has produced **comprehensive, production-ready documentation** for Taylor's Assistant:

### PRD Strengths:
- Clear problem statement and user personas
- Innovative file-system-as-brain architecture
- Realistic business model with freemium pricing
- Detailed user stories and jobs-to-be-done

### MVP Spec Strengths:
- Concrete 6-week implementation plan
- Production-ready code samples
- Pragmatic technology choices
- Cost-conscious infrastructure design

### Overall Assessment:
The documentation is **well-suited for implementation** by either you or a development team. It balances strategic vision (why build this) with tactical execution (how to build it). The transparent file system is a genuinely differentiating feature that should resonate with technically-minded users like Taylor.

The 6-week timeline is aggressive but achievable if you focus ruthlessly on the MVP scope and resist feature creep. The architecture is sound, the costs are reasonable, and the user experience is thoughtfully designed.

**Recommendation**: Start with Week 1 (foundation) and validate the workspace manager implementation before committing to the full 6-week sprint. Get Taylor's hands on a working prototype early to ensure the UX matches his mental model.