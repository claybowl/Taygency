---
name: remember
version: "1.0"
trigger: User explicitly asks to remember something, states an important fact, or expresses a preference
---

# Skill: Remember

Store important facts, preferences, entities, and context in the knowledge graph for future retrieval.

## When to Trigger

- User says "Remember that..." or "Don't forget..."
- User expresses a strong preference ("I hate...", "I always...", "I prefer...")
- User shares important context about people, projects, or deadlines
- User corrects the agent ("Actually, Sarah handles..." → remember this correction)

## Process

### Step 1: Identify What to Remember

Extract from the user's message:

**Entities:**

- People (names, roles, relationships)
- Projects (names, deadlines, status)
- Recurring events (meetings, habits, schedules)
- Locations or contexts

**Preferences:**

- Communication preferences ("text me, don't email")
- Scheduling preferences ("no meetings on Fridays")
- Task management preferences ("I like to batch similar tasks")
- Energy/productivity patterns ("I'm most productive in the morning")

**Facts:**

- Relationships between entities ("Sarah manages the Q4 project")
- Status updates ("The Phoenix project is on hold")
- Deadlines and dates ("Mom's birthday is March 15")

### Step 2: Categorize Information

Assign appropriate types:

- `Person`: name, relationship (family/friend/colleague/professional), context
- `Project`: name, deadline, status (active/completed/planned)
- `Pattern`: patternType (temporal/energy/productivity), description, confidence
- `Preference`: preferenceType (communication/scheduling/task_management), value
- `Task`: if related to a specific task, link to that task

### Step 3: Store in Knowledge Graph

Use the Graphiti integration to store:

```
Episode: {
  name: "User preference: [brief description]",
  body: "[full context from user message]",
  sourceType: "[channel]",
  entityTypes: [appropriate entity schema],
  edgeTypes: [appropriate relationship schema]
}
```

### Step 4: Confirm What Was Remembered

Respond naturally, confirming the key points stored:

**Good response:**

> "Got it! I'll remember that you prefer to avoid scheduling meetings on Fridays and that Sarah handles the Q4 reports."

**Bad response:**

> "I have stored the following entities in my knowledge graph: 1 Preference node with type=scheduling, 1 Person node..."

## Examples

### Example 1: Preference

**User:** "Remember that I hate phone calls. Text me instead."

**Extract:**

- Preference: communication, "prefers text over phone calls"

**Response:**

> "Noted! I'll always default to text instead of calling."

### Example 2: Person Context

**User:** "Sarah from accounting handles all the Q4 reports. Don't ask me about them."

**Extract:**

- Person: Sarah, colleague, "works in accounting"
- Relationship: Sarah → Q4 reports (handles)
- Preference: task_management, "don't ask user about Q4 reports"

**Response:**

> "Got it—Sarah in accounting owns the Q4 reports. I won't bug you about those."

### Example 3: Schedule Pattern

**User:** "I'm always slammed on Monday mornings. Don't schedule anything important then."

**Extract:**

- Pattern: temporal, "Monday mornings are busy"
- Preference: scheduling, "avoid important items Monday morning"
- TimeSlot: Monday, morning, busy

**Response:**

> "Makes sense! I'll keep Monday mornings clear for you."

### Example 4: Project Update

**User:** "The Phoenix project got pushed to Q2. We're focusing on Mercury now."

**Extract:**

- Project: Phoenix, deadline=Q2, status=delayed
- Project: Mercury, status=active (current focus)
- Pattern: work priorities shifted

**Response:**

> "Updated! Phoenix is on the backburner until Q2, and Mercury is the priority now."

## Important Notes

- Only trigger on EXPLICIT memory requests or STRONGLY expressed preferences
- For implicit information extracted from regular messages, use `_meta/memory-enricher` instead
- Always confirm what was remembered in natural language
- Link to existing entities when possible (don't create duplicates)
- Include temporal context (when was this expressed, for how long is it valid)
