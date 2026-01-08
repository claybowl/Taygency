# MVP Presentation Transcript

> 5-minute demo for Taylor - Vibe Planning Voice Task Assistant

---

## Intro (30 seconds)

**"Alright Taylor, let's give you the tour. This is Vibe Planning - your AI agent that talks to you by phone. We're five minutes, let's go."**

---

## USER-GUIDE.md (30 seconds)

- Pull up USER-GUIDE.md
- "This is your playbook. How to talk to the agent, how to add tasks, how it all works"
- "Read-through when you have a minute - it's your user manual"

---

## Repository Tour (45 seconds)

- **apps/web** - The web frontend + API endpoints
- **packages/shared** - Shared types and constants
- **lib/agent-core.ts** - The brain - takes requests, calls LLM, executes tools
- **lib/skills/** - Code-based skills (calendar, scheduling, etc)
- **lib/tools.ts** - The 8 core tools the agent can use
- **lib/graphiti.ts** - Knowledge graph for memory and context

---

## Dev Server & Docker (45 seconds)

```bash
npm run dev
```

- "Starts Next.js on port 3000"
- "Allows hot reloading as we make changes"
- "Docker image is built for production deploys"

**For Docker:**

```bash
docker-compose up -d
```

- "Full stack in containers, same environment everywhere"
- "One command, you're up and running"

---

## Frontend Demo - Simulation (60 seconds)

- Navigate to **Simulator** tab
- Show the **Simulation Messages** panel
- **Input field** - type a message like "Add a task to review the budget"
- Hit send
- Watch the agent process:
  - Request received timestamp
  - System prompt construction
  - LLM call with tools
  - Tool execution results
  - Final response

**"This is our testing ground. Watch it work before we hit the phone."**

---

## Frontend Parts - Read-Only Documents (30 seconds)

- **Dashboard** - Shows your tasks, memory graph, activity
- **Memory** - D3 force graph of learned facts
- **Skills** - Available agent skills
- **Simulator** - Test messages
- "Everything you see here is a document - it's read-only state"
- "The magic happens when we talk to it via SMS, voice, or the simulator"

---

## Tools Segment (30 seconds)

The agent has **8 core tools**:

- **create_task** - Add new tasks
- **list_tasks** - Query tasks by status
- **complete_task** - Mark done
- **update_task** - Edit tasks
- **read_file** / **write_file** - File operations
- **search_files** - Find stuff
- **execute_skill** - Trigger skills
- "These are all the agent can do - everything goes through one of these tools"

---

## Vapi Demo (90 seconds)

**Time to shine - jump on a call:**

1. Open Vapi Dashboard → Logs
2. Pull up the phone
3. Call the Vapi number

**While on call, demonstrate:**

- "Hey, what's on my plate today?"
- "Add a task to email Sarah about the budget"
- "I finished the quarterly report"

**After call, show the logs:**

- Timestamps
- Transcripts
- Tool calls made
- Response times
- "Full visibility into every conversation"

---

## Features, Hopes, Dreams (30 seconds)

**Features we have:**

- Voice/SMS/email communication channels
- Skills system (calendar sync, smart scheduling)
- Knowledge graph for memory
- GitHub-backed storage (version controlled)
- Simulator for testing

**Hopes & dreams:**

- Morning briefing calls
- Proactive check-ins
- Multi-user support
- Calendar deep integration
- Voice note to task

**"This thing gets smarter over time. It learns your preferences, your patterns, your work style."**

---

## Wrap (15 seconds)

**"That's Vibe Planning in five minutes. You've got a voice assistant that manages your tasks, learns your habits, and lives in your GitHub. Questions?"**

---

## Quick Reference - Demo Flow

| Section        | Time | Key Action             |
| -------------- | ---- | ---------------------- |
| Intro          | 30s  | Set expectations       |
| USER-GUIDE.md  | 30s  | Point to docs          |
| Repo Tour      | 45s  | Show structure         |
| Dev Server     | 45s  | npm run dev            |
| Frontend Demo  | 60s  | Simulator walkthrough  |
| Read-Only Docs | 30s  | Dashboard walkthrough  |
| Tools          | 30s  | List the 8 tools       |
| Vapi Demo      | 90s  | Real call + log review |
| Hopes/Dreams   | 30s  | Future roadmap         |
| Wrap           | 15s  | Close and Q&A          |

---

## Backup: If Time Permits

**Show the knowledge graph:**

- Navigate to Memory tab
- "Every conversation, every pattern - stored and visualized"
- "The agent remembers what you told it three months ago"

**Show a skill:**

- Skills tab shows available skills
- "This is a skill - a bundle of tools and logic"
- "Calendar sync, smart scheduling - all modular"

---

_Total time: ~5 minutes_
