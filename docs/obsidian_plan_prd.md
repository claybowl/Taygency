# "Taylor" - Personal AI Chief of Staff

## Product Requirements Document

A proactive AI assistant that:

- **Calls you** for morning briefings and accountability check-ins
- **Reads your notes** to understand your projects, goals, and dreams
- **Spots opportunities** you might miss in your own data
- **Keeps you honest** about commitments and deadlines
- **Thinks alongside you** when planning or brainstorming

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            INPUT CHANNELS                                │
├──────────┬──────────┬──────────┬──────────┬──────────────────────────────┤
│  Email   │   SMS    │  Voice   │ Obsidian │    Web Dashboard             │
│ Inbound  │  Inbound │  (Vapi)  │  Notes   │    (Manual)                  │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────────┬───────────────────┘
     │          │          │          │                │
     ▼          ▼          ▼          ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TAYGENCY AGENT CORE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Task Agent  │  │ Memory Agent│  │ Voice Agent │  │ Insight Agent│    │
│  │ (CRUD,      │  │ (Knowledge  │  │ (Vapi calls,│  │ (Pattern    │     │
│  │  Schedule)  │  │  Graph)     │  │  Check-ins) │  │  Detection) │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENT STORAGE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ GitHub:     │  │ GitHub:     │  │ Neo4j:      │  │ GitHub:     │     │
│  │ task-data/  │  │ obsidian/   │  │ Knowledge   │  │ logs/       │     │
│  │ (Tasks,     │  │ (Notes,     │  │ Graph       │  │ (Traces,    │     │
│  │  Context)   │  │  Projects)  │  │             │  │  History)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROACTIVE OUTPUTS                                │
├──────────┬──────────┬──────────┬────────────────────────────────────────┤
│ Morning  │ Accounta-│ Insight  │  "Hey, I noticed you mentioned         │
│ Briefing │ bility   │ Alerts   │   wanting to learn piano 3 times       │
│ Call     │ Check-in │ (SMS)    │   this month but haven't scheduled     │
│ (Voice)  │ (Voice)  │          │   any practice time..."                │
└──────────┴──────────┴──────────┴────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Voice Foundation (Vapi Integration)

_The "killer feature" - proactive voice check-ins_

#### 1.1 Vapi Webhook Integration

```
Vapi Call → Webhook → /api/vapi/webhook → Agent processes → Response → Vapi speaks
```

**New Files:**

- `apps/web/app/api/vapi/webhook/route.ts` - Receive Vapi events
- `apps/web/lib/vapi-client.ts` - Outbound call initiation
- `apps/web/lib/voice-agent.ts` - Voice-specific agent logic

#### 1.2 Voice Skills to Implement

| Skill                    | Description                                | Trigger                         |
| ------------------------ | ------------------------------------------ | ------------------------------- |
| `morning_briefing_call`  | Agent initiates call with today's overview | Scheduled (e.g., 7 AM)          |
| `end_of_day_recap`       | Review what got done, plan tomorrow        | Scheduled (e.g., 9 PM)          |
| `accountability_checkin` | "Did you finish X? How's Y going?"         | Scheduled or deadline-triggered |

#### 1.3 Scheduled Calls Infrastructure

- Vercel Cron jobs for scheduled triggers
- Deadline-based triggers from task system
- Ad-hoc call initiation from dashboard

---

### Phase 2: Obsidian as Second Brain

_Knowledge base integration after Notion import_

#### 2.1 Recommended Vault Structure

```
obsidian-vault/  (or task-data/vault/)
├── 0-Inbox/           # Quick capture, unsorted
├── 1-Projects/        # Active projects with status
├── 2-Areas/           # Ongoing responsibilities (Health, Finance, etc.)
├── 3-Resources/       # Reference material
├── 4-Archive/         # Completed/inactive
├── Daily/             # Daily notes (YYYY-MM-DD.md)
├── People/            # CRM-style people notes
└── Templates/         # Note templates
```

#### 2.2 Obsidian Integration API

| Endpoint              | Method | Description                  |
| --------------------- | ------ | ---------------------------- |
| `/api/vault/search`   | GET    | Semantic search across notes |
| `/api/vault/daily`    | GET    | Today's daily note           |
| `/api/vault/projects` | GET    | Active projects summary      |
| `/api/vault/capture`  | POST   | Quick capture to inbox       |

#### 2.3 Note-Aware Skills

| Skill                | Description                            |
| -------------------- | -------------------------------------- |
| `context_retrieval`  | Pull relevant notes into agent context |
| `project_summarizer` | "What's the status of Project X?"      |
| `connection_finder`  | "This task relates to these notes..."  |
| `daily_note_parser`  | Extract tasks/todos from daily notes   |

---

### Phase 3: Proactive Insight Engine

_The "spotting opportunities" magic_

#### 3.1 Pattern Detection System

- Recurring themes in notes (mentioned 3+ times = important?)
- Stalled projects (no activity in X days)
- Overdue commitments
- Energy/productivity patterns
- Deadline clustering

#### 3.2 Insight Types

| Insight Type           | Example                                                      | Trigger Condition            |
| ---------------------- | ------------------------------------------------------------ | ---------------------------- |
| **Stalled Dream**      | "You mentioned learning Spanish 5 times but haven't started" | Repeated mention, no action  |
| **Hidden Connection**  | "Your note about X relates to your goal Y"                   | Semantic similarity detected |
| **Deadline Cluster**   | "3 deadlines in 2 days - want to redistribute?"              | Calendar analysis            |
| **Neglected Area**     | "No entries in 'Health' area for 2 weeks"                    | Area monitoring              |
| **Opportunity Window** | "Tomorrow is light - good day for deep work"                 | Calendar + energy patterns   |

#### 3.3 Delivery Mechanism

| Urgency | Channel    | Example                        |
| ------- | ---------- | ------------------------------ |
| High    | Voice Call | Important deadline approaching |
| Medium  | SMS        | Insight discovered             |
| Low     | Dashboard  | Non-urgent pattern detected    |

---

### Phase 4: Thinking Partner Mode

_Agent helps you plan, brainstorm, dream_

#### 4.1 Conversation Modes

| Mode                | Use Case                                      | Agent Behavior               |
| ------------------- | --------------------------------------------- | ---------------------------- |
| **Planning Mode**   | "Let's plan out Q1 goals"                     | Structured, goal-oriented    |
| **Brainstorm Mode** | "Help me think through this problem"          | Exploratory, question-asking |
| **Review Mode**     | "What did I accomplish this week?"            | Analytical, summary-focused  |
| **Dream Mode**      | "What have I been wanting to do but haven't?" | Excavates buried aspirations |

#### 4.2 Context-Rich Conversations

Agent automatically pulls in:

- Relevant notes from Obsidian vault
- Past conversations on this topic
- Related tasks and projects
- Stated goals and values from context files
- Historical patterns and preferences

---

## Technical Implementation Details

### Vapi Integration Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │     │    Vapi     │     │   Phone     │
│   Cron      │────▶│   API       │────▶│   Network   │
│   Trigger   │     │ (Outbound)  │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Taygency   │◀────│    Vapi     │◀────│    User     │
│   Agent     │     │  Webhook    │     │   Speech    │
│             │────▶│  (Response) │────▶│             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### New Environment Variables Required

```env
# Vapi Configuration
VAPI_API_KEY=xxx
VAPI_PHONE_NUMBER=+15551234567
VAPI_ASSISTANT_ID=xxx

# Scheduling
USER_TIMEZONE=America/Chicago
MORNING_BRIEFING_TIME=07:00
EVENING_RECAP_TIME=21:00
USER_PHONE_NUMBER=+1xxxxxxxxxx
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/morning-briefing",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/evening-recap",
      "schedule": "0 21 * * *"
    },
    {
      "path": "/api/cron/check-deadlines",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

---

## User Preferences (Captured)

- **Primary Input Methods**: All channels (Email, SMS, Voice, Obsidian, Web)
- **Proactive Agent**: Yes, with interesting/important workflows
- **Preferred Channels**: SMS for insights, occasional voice calls
- **User Type**: Single user (personal productivity)
- **Killer Features**:
  1. Voice assistant for accountability, check-ins, advice
  2. Note-reading agent that helps think, plan, dream
  3. Opportunity spotting from personal data
  4. Insight generation from patterns
  5. Work tracking and deadline management

---

## Quick Start Options

### Option A: Voice Check-in MVP (2-3 hours)

Build Vapi webhook + one working voice skill:

1. Create `/api/vapi/webhook` route
2. Implement `accountability_checkin` skill
3. Agent can answer "What should I be working on?"
4. Test with manual Vapi call

### Option B: Obsidian Foundation (2-3 hours)

Set up vault structure and basic reading:

1. Create `task-data/vault/` structure
2. Build `/api/vault/search` endpoint
3. Add `obsidian_context` skill
4. Agent can answer "What do my notes say about X?"

### Option C: Proactive Scheduler (2-3 hours)

Build cron system for proactive outreach:

1. Create `/api/cron/morning-briefing` endpoint
2. Vercel Cron configuration
3. SMS delivery via existing infrastructure
4. Agent sends morning summary at configured time

---

## Success Metrics

| Metric                    | Target                 | How Measured            |
| ------------------------- | ---------------------- | ----------------------- |
| Daily active check-ins    | 2+ per day             | Log count               |
| Task completion rate      | +20% improvement       | Before/after comparison |
| Insight acceptance rate   | 50%+ acted upon        | User feedback           |
| Voice call satisfaction   | 4+/5 stars             | Post-call rating        |
| Notes → Action conversion | Track mentions → tasks | Pattern analysis        |

---

## Open Questions

1. **Vapi Setup**: Account ready? Phone number provisioned?
2. **Schedule Preferences**: Exact times for briefing/check-in/recap?
3. **Notion Timeline**: When is the Notion → Obsidian migration planned?
4. **First Voice Interaction**: What should the first call be about?
5. **Insight Frequency**: How often is too often for SMS insights?

---

_Document Created: January 8, 2025_
_Status: Planning Phase_
_Next Action: Choose implementation starting point (Option A, B, or C)_
