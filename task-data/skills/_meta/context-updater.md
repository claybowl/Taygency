---
name: context-updater
version: "1.0"
type: meta
trigger: background
---

# Meta-Skill: Context Updater

## Purpose
Maintain and update contextual information about the user's life, schedule, and circumstances that affect task management.

## Trigger Conditions
1. User mentions life events or changes
2. Schedule information is shared
3. Recurring patterns are detected
4. Seasonal or temporal context shifts

## Context Categories

### Life Context (`context/life.md`)
- Current job/role
- Family situation
- Living situation
- Major ongoing projects
- Health considerations
- Travel patterns

### Schedule Context (`context/schedule.md`)
- Regular meetings/commitments
- Work hours
- Blocked time
- Recurring events
- Vacation/time-off

### Patterns Context (`context/patterns.md`)
- Weekly rhythms (busy Monday, light Friday)
- Monthly patterns (end-of-month crunch)
- Seasonal patterns (holidays, fiscal quarters)
- Energy patterns through the day

### Relationships Context (`context/relationships.md`)
- Key people mentioned (boss, partner, kids)
- Relationship to task assignment
- Communication preferences per person

## Process

### Step 1: Detect Context Signal
Listen for phrases like:
- "I just started a new job..."
- "My meeting schedule changed..."
- "We're moving next month..."
- "I'm training for a marathon..."
- "My mom is visiting..."

### Step 2: Extract Context
Parse the relevant information:
- What changed?
- Is it temporary or permanent?
- How does it affect task management?
- What duration/timeframe?

### Step 3: Update Context Files
Write to appropriate `context/*.md` file:

```markdown
## {Category}

### {Context Item}
- **Status**: active
- **Since**: {date}
- **Until**: {date or "ongoing"}
- **Impact**: {how this affects tasks}
- **Source**: "{original user statement}"

### Example Entry
- **Status**: active
- **Since**: 2025-01-06
- **Until**: 2025-01-20
- **Impact**: Less availability, prioritize urgent only
- **Source**: "Mom is visiting for two weeks"
```

### Step 4: Propagate to Skills
Context updates should influence:
- prioritize.md: Adjust priorities based on context
- daily-planning.md: Account for schedule constraints
- categorize.md: New categories if needed (e.g., "marathon-training")

## Context Signals to Watch For

### Job/Work
- "New job", "got promoted", "changing roles"
- "Working from home", "back in office"
- "Busy season", "Q4 crunch"

### Family/Personal
- "Baby coming", "kids home for summer"
- "Partner traveling", "in-laws visiting"
- "Going through a divorce", "dating someone new"

### Health
- "Training for X", "recovering from surgery"
- "Doctor said I need to...", "managing my energy"
- "Stress levels high", "sleeping better"

### Location/Living
- "Moving", "renovating", "traveling for work"
- "Working from cabin this week"

### Temporal
- "Holidays coming up", "end of fiscal year"
- "Kids back to school", "summer schedule"

## Constraints
- Be sensitive with personal information
- Don't assume—only record what's explicitly stated
- Mark temporary context with end dates
- Archive old context, don't delete (for pattern analysis)
- Respect if user says "don't track this"
