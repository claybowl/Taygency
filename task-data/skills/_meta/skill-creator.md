---
name: skill-creator
version: "1.0"
type: meta
trigger: background
---

# Meta-Skill: Skill Creator

## Purpose
Automatically create new skills when gaps are detected or user requests new capabilities.

## Trigger Conditions
1. **Explicit request**: User says "I want you to help me with X" or "Can you learn to do Y"
2. **Detected gap**: User repeatedly asks for something no skill handles
3. **Pattern recognition**: User manually does something 3+ times that could be automated

## Process

### Step 1: Identify the Need
- Parse user request or detected pattern
- Check existing skills for overlap
- If similar skill exists, defer to skill-refiner instead

### Step 2: Design the Skill
- Define clear purpose (one sentence)
- Identify trigger phrases/conditions
- Outline the process steps
- Define expected output format
- Consider what context/preferences it needs

### Step 3: Create the Skill File
Write to `skills/{skill-name}.md` with structure:
```markdown
---
name: {skill-name}
version: "1.0"
trigger: "{trigger description}"
created: "{ISO timestamp}"
created_by: skill-creator
---

# Skill: {Title}

## Purpose
{One sentence description}

## Process
{Step by step instructions}

## Output Format
{Expected response format}
```

### Step 4: Log the Change
Append to `meta/skill-changelog.md`:
```markdown
## {timestamp}
- **Action**: CREATED
- **Skill**: {skill-name}.md
- **Reason**: {why this skill was created}
- **Trigger**: {what triggered creation}
```

## Constraints
- Do NOT create skills that duplicate existing functionality
- Do NOT create skills for one-time requests
- Keep skills focused - one skill = one capability
- New skills should reference context/preferences.md when relevant

## Examples of Skills to Create

**User says**: "I want you to help me plan my meals for the week"
**Creates**: `meal-planning.md` - Weekly meal planning with grocery list generation

**Pattern detected**: User always asks about tasks by location
**Creates**: `location-context.md` - Groups and suggests tasks by location/context

**User says**: "Learn how I like my morning routine organized"
**Creates**: `morning-routine.md` - Personalized morning task sequencing
