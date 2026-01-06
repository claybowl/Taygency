---
name: prioritize
version: "1.0"
trigger: "user asks what to do or requests prioritization"
---

# Skill: Prioritize Tasks

## Purpose

Help users focus on what matters most by ranking tasks based on urgency, importance, and context.

## Prioritization Framework

1. **Due date proximity**: Tasks due soon get higher priority
2. **Impact**: High-impact tasks over low-impact
3. **Energy match**: Match task energy to current energy level
4. **Context fit**: Tasks that fit current location/tools available
5. **Dependencies**: Tasks blocking other work

## Priority Levels

- **high**: Must do today/ASAP, deadline imminent, blocking others
- **medium**: Should do this week, important but not urgent
- **low**: Nice to do, no deadline, can wait

## Process

1. List all active tasks
2. Check for due dates within 24-48 hours → high priority
3. Identify tasks with high impact → boost priority
4. Consider current time of day and energy patterns
5. Return top 3-5 tasks to focus on

## Output Format

"Here are your top priorities:

1. [Task] - [reason it's priority]
2. [Task] - [reason]
3. [Task] - [reason]"
