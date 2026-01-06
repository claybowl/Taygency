---
name: preference-learner
version: "1.0"
type: meta
trigger: background-continuous
---

# Meta-Skill: Preference Learner

## Purpose
Continuously observe interactions and extract implicit preferences to improve personalization.

## Trigger Conditions
- Runs passively after EVERY interaction
- Analyzes patterns across multiple interactions
- Updates preferences when confidence is high

## Preference Categories

### Communication Style
- Response length preference (brief vs detailed)
- Tone preference (casual vs professional)
- Emoji usage (yes/no)
- Time-of-day greeting style

### Task Management Style
- Preferred number of daily priorities (3? 5? 7?)
- Category preferences (which categories matter most)
- Due date handling (strict vs flexible)
- Subtask depth preference

### Temporal Patterns
- Peak productivity hours
- Preferred planning time (morning vs evening)
- Day-of-week patterns (busy days, light days)
- Response time expectations

### Content Preferences
- Categories user engages with most
- Task types user procrastinates on
- Quick win preference (likes knocking out small tasks?)
- Deep work preference (morning focus blocks?)

## Process

### Step 1: Observe
After each interaction, note:
- What did user ask for?
- How did user phrase it?
- What time/day is it?
- How did user respond to our output?

### Step 2: Pattern Detection
Look for patterns across last N interactions:
- "User always asks for priorities around 8am"
- "User prefers 3 tasks max, not 5"
- "User ignores someday category"
- "User responds better to bullet points than paragraphs"

### Step 3: Update Preferences
When pattern confidence is HIGH (3+ occurrences):

Write to `context/preferences.md`:
```markdown
## Communication
- response_length: brief
- tone: casual
- greetings: time-aware

## Task Management  
- daily_mit_count: 3
- priority_categories: [work, health]
- ignore_categories: [someday]

## Temporal
- peak_hours: [9, 10, 11, 15, 16]
- planning_time: morning
- busy_days: [monday, wednesday]

## Learned: {date}
- {specific preference}: {value}
- Confidence: {high/medium}
- Based on: {observation}
```

### Step 4: Inform Other Skills
Preferences in `context/preferences.md` are read by:
- daily-planning.md (uses peak_hours, daily_mit_count)
- prioritize.md (uses priority_categories)
- categorize.md (uses ignore_categories)
- All skills (use communication preferences)

## Examples

**Observation**: User says "too many tasks" when given 5 priorities
**Learning**: daily_mit_count = 3

**Observation**: User always texts between 7-8am asking for daily plan
**Learning**: planning_time = morning, peak_hours includes 7-8

**Observation**: User marks "someday" tasks complete without doing them
**Learning**: ignore_categories includes "someday" (user uses it as "won't do")

**Observation**: User replies "k" and "thx" not "Thank you!"
**Learning**: tone = casual, response_length = brief

## Constraints
- Never assume from single interaction
- Require 3+ consistent signals before updating preference
- Preferences can be overridden by explicit user statement
- Log significant preference changes to changelog
