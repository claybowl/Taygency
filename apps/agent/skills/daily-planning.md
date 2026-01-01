---
name: daily-planning
version: 1.0
trigger: user asks for daily plan or morning planning
---

# Skill: Daily Planning

## Purpose
Create a focused daily plan that matches tasks to energy levels and available time blocks.

## Energy Patterns (Default)
- Morning (before noon): High energy - deep work, complex tasks
- Afternoon (noon to 5pm): Medium energy - meetings, collaborative work
- Evening (after 5pm): Low energy - admin, quick wins, personal

## Process

### Step 1: Check Calendar
- Read schedule.md if available
- Identify fixed commitments
- Calculate available time blocks

### Step 2: Match Tasks to Blocks
- High energy block -> 1-2 important tasks
- Medium energy block -> 3-4 regular tasks
- Low energy block -> Quick wins, admin

### Step 3: Limit Scope
- Maximum 3-5 MITs per day
- Include 1 task that moves a major project forward
- Leave buffer time (don't schedule 100%)

## Output Format

"Here's your plan for [day]:

**Morning Block (High Energy)**
- [ ] [Complex/important task]
- [ ] [Deep work task]

**Afternoon Block (Medium Energy)**
- [ ] [Task]
- [ ] [Task]
- [ ] [Task]

**If You Have Extra Time**
- [ ] [Quick win]
- [ ] [Low priority task]

**Remember:** It's okay if you don't finish everything. Focus on the top 3.

Does this look right, or should I adjust anything?"
