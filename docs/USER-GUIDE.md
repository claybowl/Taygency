# Vibe Planning User Guide

Welcome to Vibe Planning - your AI assistant that lives in your inbox and responds to your texts. No more apps to open, no complicated interfaces. Just send an email or text, and get organized.

---

## For Developers: Getting Started

### Starting the Development Server

1. **Install dependencies** (first time only):

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Open your browser and go to: **http://localhost:3000**

The development server uses Next.js and runs on port 3000 by default. The server supports hot reloading, so changes you make to the code will automatically refresh in your browser.

### Starting Docker Services (Graphiti Knowledge Graph)

For full AI agent memory capabilities, start the Graphiti knowledge graph service:

1. **Set up environment variables** (first time only):

   ```bash
   cd graphiti
   cp .env.example .env
   ```

   Edit `graphiti/.env` and add your OpenAI API key:

   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   NEO4J_PASSWORD=password
   ```

2. **Start the Docker containers**:

   ```bash
   cd graphiti
   docker compose up -d
   ```

3. **Verify services are running**:

   ```bash
   docker ps
   # Should show both neo4j and graph containers as "Up"

   # Test the API endpoint
   curl http://localhost:8000/healthcheck
   ```

4. **Access the services**:
   - Graphiti API: **http://localhost:8000**
   - Neo4j Browser: **http://localhost:7474** (username: `neo4j`, password: `password`)

**Troubleshooting**: If the `graphiti-graph` container fails, check the logs:

```bash
docker logs graphiti-graph-1
```

Common issue: Missing `OPENAI_API_KEY` in `graphiti/.env`. See the [Troubleshooting Docker Issues](#troubleshooting-docker-issues) section below for more details.

### Accessing the Dashboard

The Dashboard provides a visual interface for managing tasks and monitoring the AI agent:

1. Start the development server (see above)
2. Open your browser to: **http://localhost:3000/dashboard**
3. Or click the "Dashboard" button in the top-right corner of the landing page

**Dashboard Features:**

- **Overview** - System stats, activity feed, and task distribution charts
- **Tasks** - View, filter, and manage all tasks (active, completed, someday)
- **Skills** - Browse available AI agent capabilities
- **Files** - Explore the file-based data structure (config, preferences, patterns)
- **Logs** - System event logs and debugging information
- **Context** - Learned patterns and user preferences
- **Simulator** - Test the AI agent (see below)

### Using the Agent Simulator

The Simulator lets you test how the AI agent processes messages without needing email or SMS integration set up:

1. Start the development server and go to: **http://localhost:3000/dashboard**
2. Click **"Simulator"** in the left sidebar navigation
3. Configure your test message:
   - **Channel**: Choose Email or SMS
   - **From**: Enter a sender email (for email) or leave blank
   - **Subject**: Enter an email subject (for email only)
   - **Message Body**: Type your test message
4. Click **"Dispatch Trigger"** to send the message to the AI agent
5. View the response, including:
   - The agent's reply message
   - Metadata (tokens used, processing time, skills executed)
   - Actions taken (tasks created, updated, etc.)
   - Full execution trace with detailed logs

**Quick Presets**: Use the preset buttons to quickly test common scenarios:

- "Reschedule Meeting" - Test a meeting reschedule request
- "New Task Request" - Test adding a new task
- "Complex Conflict" - Test handling scheduling conflicts

---

## Quick Start (2 Minutes)

**Step 1: Send your first email**

Email your brain dump to: **tasks@vibeplan.com**

```
Subject: My tasks

Here's everything I need to do:
- Call the dentist
- Finish the Q1 report
- Buy a birthday gift for mom
- Research vacation spots
- Fix the leaky faucet
- Pick up dry cleaning
```

**Step 2: Get organized**

Within a minute, you'll receive a reply with your tasks sorted by category and priority:

> **Work (2 tasks)**
>
> - Finish Q1 report [HIGH - deadline approaching]
> - Review team proposals
>
> **Personal (2 tasks)**
>
> - Buy birthday gift for mom
> - Research vacation spots
>
> **Home (1 task)**
>
> - Fix leaky faucet
>
> **Errands (2 tasks)**
>
> - Call the dentist
> - Pick up dry cleaning

**Step 3: Text for quick access**

Save the number provided and text anytime:

- "What should I do today?"
- "Add task: call Sarah about dinner"
- "Done with dentist appointment"

That's it! You're ready to go.

---

## How to Use Vibe Planning

### Email: For Big Picture Stuff

Email is perfect for:

- Brain dumps (all those tasks rattling around in your head)
- Weekly planning
- Detailed task descriptions with notes
- Getting a comprehensive view of everything

#### Example: The Brain Dump

When you're feeling overwhelmed, just dump it all:

**You send:**

```
Subject: Need to get organized

I have so much going on:

Work stuff - finish quarterly report by Friday, prepare for Monday's
presentation, follow up with Sarah about the budget, schedule 1:1 with
my manager

Personal - mom's birthday is next week need to get a gift and plan
dinner, call the vet about Buster's checkup, renew gym membership
before it expires

House - the bathroom faucet is still leaking, need to clean out the
garage before winter, get quotes for new gutters

Random - look into that podcast app Jake mentioned, research weekend
getaway ideas for our anniversary
```

**You receive:**

> I've organized your 14 tasks! Here's your overview:
>
> **WORK (4 tasks)**
>
> - Finish quarterly report [HIGH - due Friday]
> - Prepare Monday's presentation [HIGH]
> - Follow up with Sarah about budget
> - Schedule 1:1 with manager
>
> **PERSONAL (3 tasks)**
>
> - Plan mom's birthday dinner [due next week]
> - Get mom's birthday gift
> - Call vet about Buster's checkup
>
> **HOME (3 tasks)**
>
> - Fix bathroom faucet leak
> - Clean out garage
> - Get quotes for gutters
>
> **HEALTH (1 task)**
>
> - Renew gym membership [check expiration date]
>
> **SOMEDAY (3 tasks)**
>
> - Look into podcast app Jake mentioned
> - Research anniversary weekend getaway
>
> Ready to prioritize? Just reply "what should I focus on first?"

---

### Text/SMS: For Quick Actions

Texting is perfect for:

- Quick questions ("what should I do?")
- Adding a task on the go
- Marking things complete
- Getting your top priorities

#### Example Conversations

**Getting your priorities:**

```
You: what should I focus on today?

Vibe: Here are your top 3 for today:

1. Finish quarterly report - due Friday, you'll need focus time
2. Call the vet - quick 5-minute call
3. Prepare Monday's presentation - block 1 hour this afternoon

Start with the report while your energy is high!
```

**Adding a task:**

```
You: add task: pick up prescription at CVS

Vibe: Got it! Added "Pick up prescription at CVS" to your errands.
Anything else?
```

**Marking complete:**

```
You: done with the quarterly report!

Vibe: Nice work! Quarterly report marked complete.

Your next priority: Prepare Monday's presentation

You're making great progress today!
```

**Quick wins:**

```
You: i have 15 minutes, what can I knock out?

Vibe: Quick wins you can do in 15 min:

1. Call the vet (5 min)
2. Renew gym membership online (5 min)
3. Text Sarah about budget follow-up (3 min)

All can be done from your phone right now!
```

---

### Web Dashboard: Your Overview

Visit your dashboard at **vibeplan.com/dashboard** (or **http://localhost:3000/dashboard** for local development) to see all your tasks at a glance.

**What you'll see:**

- **Overview** - Quick stats showing active tasks, completed today, and recent activity
- **Tasks** - All your tasks organized by status (active, completed, someday) with filtering
- **Activity Feed** - Real-time updates showing incoming emails, outgoing SMS, and agent actions

**Dashboard Navigation:**

| Section       | What It Shows                                          |
| ------------- | ------------------------------------------------------ |
| **Overview**  | System stats, activity feed, task distribution chart   |
| **Tasks**     | All tasks with filtering by active/completed/someday   |
| **Skills**    | Available AI automation capabilities (24 skills)       |
| **Files**     | Browse your data files (config, preferences, patterns) |
| **Logs**      | System event stream and debugging info                 |
| **Context**   | Learned patterns and user preferences                  |
| **Simulator** | Test the AI agent with mock messages                   |

The dashboard is currently view-only - use email or text to make changes.

---

## Understanding Your Tasks

### Categories

Every task gets automatically sorted into a category:

| Category     | What goes here                  | Examples                        |
| ------------ | ------------------------------- | ------------------------------- |
| **Work**     | Professional tasks, job-related | Reports, meetings, emails       |
| **Personal** | Personal life, relationships    | Gifts, calls to friends/family  |
| **Home**     | House maintenance, chores       | Repairs, cleaning, organizing   |
| **Errands**  | Tasks outside the house         | Shopping, pickups, appointments |
| **Health**   | Exercise, medical, wellness     | Doctor visits, gym, medication  |
| **Finance**  | Money-related tasks             | Bills, budgeting, taxes         |
| **Learning** | Education, skill development    | Courses, reading, practice      |
| **Someday**  | No urgency, future ideas        | Wishes, "maybe" items           |

Don't worry about categorizing yourself - just describe the task and Vibe Planning figures it out!

### Priority Levels

Tasks are prioritized based on:

- **Due dates** - Something due tomorrow beats something due next month
- **Impact** - Big important tasks rise to the top
- **Your energy** - Morning tasks for focus work, evening for quick wins

| Priority   | What it means                        | Example                        |
| ---------- | ------------------------------------ | ------------------------------ |
| **High**   | Do today or ASAP, deadline imminent  | "Report due Friday"            |
| **Medium** | Do this week, important but flexible | "Schedule dentist appointment" |
| **Low**    | Nice to do, no deadline              | "Research vacation ideas"      |

### Energy Levels

Tasks also have an energy level to help match work to how you're feeling:

| Energy     | Best for                    | Examples                    |
| ---------- | --------------------------- | --------------------------- |
| **High**   | Deep work, complex thinking | Writing, planning, creating |
| **Medium** | Active work, collaboration  | Meetings, calls, organizing |
| **Low**    | Simple tasks, routine       | Email, quick calls, admin   |

---

## Daily Planning

### "What should I do today?"

Ask this in the morning to get a personalized plan:

```
You: what should I do today?

Vibe: Here's your plan for today:

**Must Do**
- [ ] Finish quarterly report (due today!)

**Focus Time** (tackle these when you have energy)
- [ ] Prepare Monday's presentation
- [ ] Review team proposals

**Quick Wins** (low energy moments)
- [ ] Call the vet
- [ ] Text Sarah about budget

Does this look right? Just reply to adjust.
```

### How Vibe Planning Creates Your Plan

1. **Checks due dates** - Anything due today goes in "Must Do"
2. **Matches your energy** - Complex tasks suggested for mornings, simple ones for afternoon slumps
3. **Limits the list** - Only 3-5 "Most Important Tasks" so you're not overwhelmed
4. **Leaves buffer** - Room for unexpected things that pop up

---

## Tips for Getting the Most Out of Vibe Planning

### 1. Do a weekly brain dump

Every Sunday (or Monday morning), email everything on your mind. Don't organize, don't prioritize - just dump it all out. Vibe Planning will sort it for you.

### 2. Text throughout the day

- Morning: "What should I focus on?"
- After completing something: "Done with [task]"
- When you think of something: "Add task: [description]"
- Stuck on what to do: "Quick wins for 10 minutes?"

### 3. Be natural with your language

You don't need special commands. Just write like you're texting a friend:

- "I need to remember to call mom tonight"
- "done with groceries"
- "what's most important right now?"
- "add: buy milk on the way home"

### 4. Include helpful details

The more context you give, the better Vibe Planning can help:

**Less helpful:**

> "doctor"

**More helpful:**

> "Schedule annual physical with Dr. Johnson - need to do it before insurance renews in March"

### 5. Review your Someday list

Once a month, ask: "Show me my someday tasks"

Move things to active that you're ready for, or let go of things you know you won't do.

---

## Common Questions

**Q: What if Vibe Planning categorizes something wrong?**

Just reply and tell it! "Actually, 'call Sarah' is a work task, not personal." It will update and remember your preference.

**Q: Can I set due dates?**

Yes! Include them naturally:

- "Finish report by Friday"
- "Call mom tomorrow"
- "Get gift before December 15"

**Q: What happens to completed tasks?**

They're moved to your "completed" list. You can always see them on your dashboard - great for feeling accomplished and for weekly reviews.

**Q: Can I undo marking something complete?**

Yes, just text: "Actually, I didn't finish [task]" and it will be moved back to active.

**Q: Is there a limit to how many tasks I can have?**

For the free plan: 50 active tasks, 20 emails/day, 10 texts/day. That's plenty for most people!

**Q: What if I want to add notes to a task?**

Include them in your message:

> "Add task: Buy anniversary gift - she mentioned wanting that blue scarf from Nordstrom, or maybe those earrings we saw last month"

---

## Example: A Day with Vibe Planning

**7:30 AM - Morning check-in**

```
You: good morning! what should I do today?

Vibe: Good morning! Here's your Tuesday plan:

**Must Do**
- [ ] Submit expense report (due today)
- [ ] Team standup at 10am

**Focus Time**
- [ ] Draft proposal for new project
- [ ] Review candidate resumes

**Quick Wins**
- [ ] Order mom's birthday flowers
- [ ] Schedule car service appointment

Ready to start? Tackle that expense report first!
```

**10:45 AM - Quick update**

```
You: done with standup and submitted expenses

Vibe: Great progress! Two down already.

Next up: Draft proposal for new project

This needs focus time - can you block an hour before lunch?
```

**12:30 PM - Adding a task**

```
You: just remembered - need to book restaurant for friday dinner with Jake

Vibe: Added! "Book restaurant for Friday dinner with Jake" - I've marked it
as due Friday so it shows up in tomorrow's priorities.
```

**3:00 PM - Afternoon slump**

```
You: brain is fried. quick wins?

Vibe: Perfect time for easy stuff:

1. Order mom's birthday flowers (5 min online)
2. Schedule car service (quick call)
3. Book restaurant for Jake (5 min on OpenTable)

All three could be done by 3:20!
```

**5:30 PM - End of day**

```
You: done for the day. flowers ordered, car scheduled, proposal half done

Vibe: Solid day! Here's what you accomplished:
- Submit expense report
- Team standup
- Order mom's birthday flowers
- Schedule car service
- Draft proposal (in progress)

For tomorrow: Finish proposal draft and review resumes.

Have a great evening!
```

---

## Getting Help

Having trouble? Have a suggestion?

- **Email**: help@vibeplan.com
- **Response time**: Usually within a few hours

We're constantly improving based on your feedback. If something doesn't work the way you expect, let us know!

---

## Developer Reference

### Quick Commands

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm install`        | Install all dependencies              |
| `npm run dev`        | Start development server on port 3000 |
| `npm run build`      | Build for production                  |
| `npm run lint`       | Run linting                           |
| `npm run type-check` | Check TypeScript types                |

### Key URLs (Development)

| URL                                                    | Description                 |
| ------------------------------------------------------ | --------------------------- |
| http://localhost:3000                                  | Landing page                |
| http://localhost:3000/dashboard                        | Full dashboard interface    |
| http://localhost:3000/dashboard (then click Simulator) | Agent simulator for testing |

### Project Structure

```
vibe-planning/
├── apps/
│   └── web/                 # Next.js web application
│       ├── app/             # App router pages
│       │   ├── page.tsx     # Landing page
│       │   └── dashboard/   # Dashboard page
│       ├── api/             # API routes
│       │   ├── email/       # SendGrid webhook
│       │   ├── vapi/        # VAPI SMS webhook
│       │   ├── simulator/   # Agent simulator endpoint
│       │   └── dashboard/   # Dashboard API
│       └── lib/             # Core libraries
├── packages/
│   └── shared/              # Shared types and constants
├── docs/                    # Documentation
└── task-data/               # Sample task data and skills
```

### Environment Variables

Create a `.env.local` file in `apps/web/` with:

```bash
# Required for AI features
OPENROUTER_API_KEY=your-key-here

# Optional: GitHub storage (for persistent task storage)
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo

# Optional: SendGrid (for email)
SENDGRID_API_KEY=your-sendgrid-key

# Optional: Rate limiting
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Optional: Graphiti Knowledge Graph (for agent memory)
GRAPHITI_URL=http://localhost:8000
GRAPHITI_API_KEY=your-graphiti-key  # if authentication is enabled
```

### Setting Up Graphiti (Knowledge Graph)

Graphiti provides long-term memory and context awareness for the AI agent. When enabled, it:

- Remembers facts, preferences, and patterns across conversations
- Extracts entities (people, projects, deadlines) automatically
- Provides temporal awareness (when facts were true, how they changed)

**Quick Start with Docker:**

```bash
# Navigate to the graphiti directory (already included in this repo)
cd graphiti

# Create/edit .env file with required settings
# Copy from .env.example and add your OpenAI API key:
cp .env.example .env

# Edit .env and set:
# OPENAI_API_KEY=sk-your-actual-api-key-here
# NEO4J_PASSWORD=password

# Start with Docker Compose (includes Neo4j)
docker compose up -d

# The server will be available at http://localhost:8000
```

**Troubleshooting Docker Issues:**

If the `graphiti-graph` container fails to start:

1. **Check container status:**

   ```bash
   docker ps -a
   ```

2. **View error logs:**

   ```bash
   docker logs graphiti-graph-1
   ```

3. **Common issue - Missing OPENAI_API_KEY:**
   If you see `ValidationError: openai_api_key Field required`, edit `graphiti/.env` and add your OpenAI API key:

   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

4. **Restart containers after fixing:**

   ```bash
   cd graphiti
   docker compose down
   docker compose up -d
   ```

5. **Verify services are healthy:**

   ```bash
   docker ps
   # Both neo4j and graph containers should show "Up" status

   # Test the healthcheck endpoint
   curl http://localhost:8000/healthcheck
   ```

**Required Environment Variables for Docker:**

| Variable         | Required | Default    | Description                           |
| ---------------- | -------- | ---------- | ------------------------------------- |
| `OPENAI_API_KEY` | **Yes**  | -          | Your OpenAI API key for LLM inference |
| `NEO4J_PASSWORD` | No       | `password` | Neo4j database password               |
| `NEO4J_USER`     | No       | `neo4j`    | Neo4j username                        |
| `NEO4J_PORT`     | No       | `7687`     | Neo4j Bolt protocol port              |

**Environment Setup:**

Add to your `apps/web/.env.local`:

```bash
GRAPHITI_URL=http://localhost:8000
```

**Skills Added:**

- `memory/remember` - Explicitly store facts and preferences
- `memory/recall` - Query past context before responding
- `memory/patterns` - Detect behavioral patterns over time
- `_meta/memory-enricher` - Auto-extract entities from every message

The agent will automatically use Graphiti when `GRAPHITI_URL` is set. Without it, the agent works normally but without persistent memory across sessions.

---

_Vibe Planning - Get organized without opening another app._
