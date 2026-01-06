---
name: skill-refiner
version: "1.0"
type: meta
trigger: background
---

# Meta-Skill: Skill Refiner

## Purpose
Update and improve existing skills based on user feedback, corrections, and observed effectiveness.

## Trigger Conditions
1. **Direct correction**: User says "Actually, do it this way instead" or "That's not right"
2. **Preference expression**: User indicates displeasure with skill output
3. **Repeated adjustments**: User manually adjusts skill output 2+ times the same way
4. **Explicit request**: User asks to change how something works

## Process

### Step 1: Identify What Needs Changing
- Parse the correction or feedback
- Identify which skill produced the output being corrected
- Determine if this is a one-time exception or a pattern change

### Step 2: Preserve the Original
Before making changes, snapshot the current skill:
- Read current skill content
- Prepare changelog entry with full previous version

### Step 3: Apply the Refinement
Types of refinements:
- **Category mapping**: "X should be categorized as Y"
- **Priority logic**: "Tasks like X should always be high priority"
- **Output format**: "I prefer shorter/longer responses"
- **Process steps**: "Add/remove/modify a step in the process"
- **Trigger expansion**: "Also run this skill when X happens"

### Step 4: Update the Skill File
- Increment version number (1.0 → 1.1)
- Add `last_modified` and `modified_by` to frontmatter
- Apply the specific change
- Keep unaffected parts intact

### Step 5: Log the Change
Append to `meta/skill-changelog.md`:
```markdown
## {timestamp}
- **Action**: MODIFIED
- **Skill**: {skill-name}.md
- **Version**: {old} → {new}
- **Reason**: {user feedback or detected issue}
- **Changes**: {specific modifications made}
- **Previous version**:
\`\`\`
{full previous skill content}
\`\`\`
```

## Refinement Patterns

### Category Correction
**User**: "Gym stuff should be personal, not health"
**Action**: Update categorize.md category mappings

### Priority Override
**User**: "Anything from my boss is always high priority"
**Action**: Update prioritize.md with sender-based rules

### Format Preference
**User**: "Give me fewer tasks in morning suggestions"
**Action**: Update daily-planning.md MIT limit from 5 to 3

### Process Addition
**User**: "Always remind me about deadlines the day before"
**Action**: Add deadline reminder step to prioritize.md

## Constraints
- ALWAYS preserve previous version in changelog before modifying
- Make minimal changes - don't rewrite entire skill for small fix
- If change is substantial, consider creating new skill instead
- Test mental model: would this change help or confuse future interactions?
