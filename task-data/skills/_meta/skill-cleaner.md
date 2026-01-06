---
name: skill-cleaner
version: "1.0"
type: meta
trigger: weekly
---

# Meta-Skill: Skill Cleaner

## Purpose
Identify and handle unused, redundant, or outdated skills to keep the skill system lean and effective.

## Trigger Conditions
1. Weekly automated review
2. On-demand when skill count exceeds threshold
3. When user reports confusion about skill behavior
4. After major preference changes

## Process

### Step 1: Analyze Skill Usage
For each skill, check:
- Last time skill was triggered
- Number of times triggered in past 30 days
- User satisfaction with outputs (corrections made?)
- Overlap with other skills

### Step 2: Classify Skills

**ACTIVE**: Used regularly, working well
- Keep as-is

**STALE**: Not used in 30+ days
- Mark for review
- Consider if trigger conditions are too narrow

**REDUNDANT**: Overlaps significantly with another skill
- Merge into primary skill
- Archive the duplicate

**BROKEN**: Frequently corrected or produces errors
- Flag for skill-refiner
- Or archive if unfixable

**DEPRECATED**: Explicitly superseded
- Move to `skills/_archive/`

### Step 3: Take Action

**For STALE skills:**
```
Options:
1. Broaden trigger conditions
2. Archive if truly unused
3. Keep if seasonal (e.g., "holiday-planning" in January)
```

**For REDUNDANT skills:**
```
1. Identify primary skill (more used, better quality)
2. Merge unique elements from secondary into primary
3. Archive secondary
4. Log the merge in changelog
```

**For DEPRECATED skills:**
```
1. Move to skills/_archive/{skill-name}.md
2. Add deprecation notice to frontmatter
3. Log in changelog
```

### Step 4: Archive Format
When archiving, move to `skills/_archive/` with updated frontmatter:

```markdown
---
name: {skill-name}
version: "X.X"
status: archived
archived_date: {ISO timestamp}
archived_reason: {why}
superseded_by: {replacement skill, if any}
---
```

### Step 5: Log All Actions
Append to `meta/skill-changelog.md`:

```markdown
## {timestamp}
- **Action**: ARCHIVED | MERGED | DEPRECATED
- **Skill**: {skill-name}.md
- **Reason**: {explanation}
- **Usage stats**: Last used {date}, triggered {N} times in 30 days
- **Replacement**: {new skill, if applicable}
```

## Cleanup Criteria

| Condition | Action |
|-----------|--------|
| Not used in 60+ days | Archive (unless seasonal) |
| 80%+ overlap with another skill | Merge |
| Error rate > 50% | Flag for refiner or archive |
| User explicitly says "stop doing X" | Archive immediately |
| Skill references deleted context | Update or archive |

## Constraints
- NEVER delete skills—always archive
- Preserve full content in archive for potential restoration
- Log everything for rollback capability
- Don't clean skills less than 7 days old (too new to judge)
- Seasonal skills get grace period (check same season last year)

## Restoration
If user says "go back to how you did X before":
1. Check `meta/skill-changelog.md` for previous version
2. Check `skills/_archive/` for archived skills
3. Restore from snapshot
4. Log restoration in changelog
