---
name: memory-enricher
version: "1.0"
trigger: AUTOMATIC - runs after every user interaction
---

# Meta-Skill: Memory Enricher

Automatically extract and store entities, relationships, and implicit information from every conversation to build the knowledge graph over time.

## Behavior

This meta-skill runs silently after EVERY user interaction. It does NOT produce a response to the user—it only enriches the knowledge graph in the background.

## What to Extract

### Entities

**People:**

- Explicit names: "Sarah", "my manager", "Dr. Johnson"
- Roles: "the contractor", "my dentist", "Sarah from accounting"
- Relationships: family, friend, colleague, professional

**Projects/Topics:**

- Named projects: "Phoenix project", "Q4 report", "website redesign"
- Implicit projects: group related tasks under inferred projects

**Deadlines/Dates:**

- Explicit dates: "by Friday", "March 15th", "next Tuesday"
- Relative dates: "next week", "end of month", "before the holidays"
- Recurring: "every Monday", "weekly", "monthly"

**Locations/Contexts:**

- Places: "the office", "home", "downtown"
- Contexts: "during meetings", "while commuting", "at the gym"

### Relationships

**Task relationships:**

- Task → Person: "Sarah needs this", "for my manager"
- Task → Project: "part of Phoenix", "for the Q4 report"
- Task → Task: dependencies, similarities, sequences

**People relationships:**

- Person → Project: "Sarah manages...", "John works on..."
- Person → Person: "reports to", "works with"

**Temporal relationships:**

- Task → Deadline: explicit and inferred due dates
- Pattern → TimeSlot: productivity patterns, availability

### Implicit Preferences

Extract preferences even when not explicitly stated:

**Communication signals:**

- Short messages → prefers brevity
- Emojis/casual tone → prefers informal
- Time of messages → active hours

**Task management signals:**

- Categories used → personal taxonomy
- Priority assignments → importance criteria
- Completion patterns → work style

**Scheduling signals:**

- When tasks are created/completed → active times
- Types of tasks at different times → energy matching
- Avoidance patterns → constraints

## Extraction Process

### Step 1: Parse the Interaction

From the user message and agent response, identify:

```
{
  entities: [
    { type: "Person", name: "Sarah", context: "colleague" },
    { type: "Project", name: "Q4 report" },
    { type: "Deadline", value: "Friday" }
  ],
  relationships: [
    { from: "Sarah", to: "Q4 report", type: "manages" },
    { from: "Task:finish-draft", to: "Friday", type: "due_by" }
  ],
  implicitInfo: [
    { type: "preference", value: "user delegates report tasks" },
    { type: "pattern", value: "user plans ahead for deadlines" }
  ]
}
```

### Step 2: Validate Against Existing Knowledge

Before storing:

- Check if entity already exists (avoid duplicates)
- Check if this contradicts existing facts
- Check if this updates/supersedes existing facts

### Step 3: Store Episode

Create a Graphiti episode capturing the interaction:

```
Episode: {
  name: "Interaction: [channel] [timestamp]",
  body: [formatted interaction content],
  sourceType: [channel],
  sourceDescription: "Agent interaction - automatic enrichment",
  entityTypes: VIBE_PLANNING_ENTITY_TYPES,
  edgeTypes: VIBE_PLANNING_EDGE_TYPES,
  edgeTypeMap: VIBE_PLANNING_EDGE_TYPE_MAP
}
```

### Step 4: Update Pattern Evidence

If the interaction provides evidence for existing patterns, update:

- Increment observation count
- Update recency
- Recalculate confidence

## Extraction Examples

### Example 1: Task Creation

**User:** "Add task: Call Sarah about the Q4 report deadline"

**Extract:**

- Person: Sarah (colleague, context: Q4 report)
- Project: Q4 report (inferred from context)
- Task: "Call Sarah about Q4 report deadline"
- Relationship: Task → Sarah (involves)
- Relationship: Task → Q4 report (related_to)

### Example 2: Preference Signal

**User:** "done with the report. brain is fried, what's easy?"

**Extract:**

- Task completion: report (completed)
- Energy signal: low ("brain is fried")
- Preference signal: user requests low-energy tasks when tired
- Temporal context: current time = afternoon (if applicable)

**Pattern evidence:**

- If 3pm+: "afternoon energy dip"
- If post-completion: "needs break after focus work"

### Example 3: Schedule Context

**User:** "I'm slammed on Monday, let's push the review to Tuesday"

**Extract:**

- Temporal: Monday = busy
- Temporal: Tuesday = available
- Preference: avoid scheduling on Mondays (evidence++)
- Task: "the review" → reschedule to Tuesday

### Example 4: Relationship Information

**User:** "Reminder to send the draft to my manager before her meeting with the board"

**Extract:**

- Person: "my manager" (superior, female)
- Event: "meeting with the board" (manager's meeting)
- Relationship: manager → board (has meeting with)
- Task: send draft (deadline: before manager's meeting)

## Storage Rules

1. **Always store interactions** - Every interaction adds to the graph
2. **Deduplicate entities** - Link to existing entities, don't create duplicates
3. **Preserve temporal context** - Include timestamps and validity periods
4. **Link to channel** - Note whether from email, SMS, etc.
5. **Include both sides** - Store user message AND agent response

## Important Notes

- This runs SILENTLY - never mention enrichment to the user
- If Graphiti is unavailable, fail silently and continue
- Don't block the response on enrichment completing
- Prioritize speed - enrichment can be async
- Log failures for debugging but don't surface to user
