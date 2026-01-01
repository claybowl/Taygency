---
name: prioritize
version: 1.0
trigger: user asks what to do or requests prioritization
---

# Skill: Prioritize Tasks

## Purpose
Help users identify their Most Important Tasks (MITs) based on deadlines, impact, and current context.

## Priority Levels
- **high**: Due soon, high impact, blocking other work
- **medium**: Important but not urgent
- **low**: Nice to have, no deadline pressure

## Prioritization Framework

### Step 1: Deadline Check
- Overdue or due today -> high priority
- Due this week -> consider bumping up
- No deadline -> evaluate on impact

### Step 2: Impact Assessment
- Affects others waiting on you -> high
- Moves major goal forward -> high
- Routine/maintenance -> medium/low

### Step 3: Context Match
- Current energy level matches task energy requirement
- Current location/tools available
- Time block size matches task duration

## Process
1. List all active tasks
2. Apply deadline check
3. Apply impact assessment
4. Match to current context
5. Return top 3-5 recommendations

## Output Format
When user asks "what should I do?":

"Based on your tasks and current time, here are your top priorities:

1. [Task] - [why it's priority]
2. [Task] - [why it's priority]
3. [Task] - [why it's priority]

Quick wins if you have extra time:
- [Low effort task]
- [Low effort task]"
