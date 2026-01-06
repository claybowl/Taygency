---
name: categorize
version: "1.0"
trigger: "new tasks imported or user requests categorization"
---

# Skill: Categorize Tasks

## Purpose

Organize tasks into meaningful categories based on context, location, energy required, and type of work.

## Default Categories

- **work**: Professional tasks, job-related
- **personal**: Personal life, relationships
- **home**: House maintenance, chores
- **errands**: Outside-the-house tasks
- **health**: Exercise, medical, wellness
- **finance**: Money-related tasks
- **learning**: Education, skill development
- **someday**: No urgency, future consideration

## Process

1. Read the task title and any notes
2. Identify keywords and context clues
3. Assign primary category
4. Assign secondary context tags if applicable
5. Estimate energy level (high/medium/low)
6. Estimate duration if not specified

## Examples

- "Call dentist" → health, low energy, 5min
- "Finish Q4 report" → work, high energy, 2hr
- "Buy birthday gift for mom" → personal + errands, medium energy, 30min

## Output

Update the task file with:

- category: primary category
- energy: low | medium | high
- duration: estimated time
- context: array of relevant tags
