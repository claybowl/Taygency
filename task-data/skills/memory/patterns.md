---
name: patterns
version: "1.0"
trigger: Analyze user behavior to detect and store recurring patterns
---

# Skill: Patterns

Detect, validate, and store recurring patterns in user behavior for improved personalization.

## When to Trigger

- After 3+ similar behaviors observed (threshold for pattern detection)
- User explicitly asks about their patterns
- When planning recommendations that benefit from pattern awareness
- During periodic pattern review (weekly)

## Pattern Categories

### Temporal Patterns

**What to detect:**

- Peak productivity times ("always does deep work in morning")
- Busy periods ("Mondays are packed with meetings")
- Recurring availability ("Friday afternoons are free")
- Seasonal patterns ("busy during Q4")

**Evidence needed:** 3+ occurrences of same temporal behavior

**Storage format:**

```
Pattern: {
  type: "temporal",
  description: "User is most productive between 8-11am",
  confidence: 0.85,
  evidence: ["completed 5 tasks before 11am on Mon", "mentioned 'morning person'", ...]
}
```

### Energy Patterns

**What to detect:**

- Energy level fluctuations ("tired after lunch")
- Task-energy matching ("does creative work when energized")
- Recovery patterns ("needs breaks between meetings")

**Evidence needed:** 3+ consistent observations

**Storage format:**

```
Pattern: {
  type: "energy",
  description: "User experiences afternoon energy dip 2-4pm",
  confidence: 0.75,
  evidence: ["requested 'quick wins' at 3pm twice", "mentioned 'brain is fried' afternoon"]
}
```

### Productivity Patterns

**What to detect:**

- Task batching preferences ("does all calls in one block")
- Context switching costs ("prefers focused blocks")
- Completion patterns ("finishes tasks in bursts")
- Procrastination triggers ("avoids expense reports")

**Evidence needed:** 3+ consistent behaviors

### Communication Patterns

**What to detect:**

- Preferred channels ("always uses SMS for quick updates")
- Response timing ("checks email in morning only")
- Message length preferences ("prefers brief responses")
- Tone preferences ("casual vs. formal")

**Evidence needed:** 5+ consistent interactions

### Categorization Patterns

**What to detect:**

- How user thinks about task categories
- Personal category definitions that differ from defaults
- Project organization preferences

## Pattern Detection Process

### Step 1: Observe Behavior

Track relevant signals across interactions:

- Task completion times
- Message channel choices
- Language used (energy indicators, time references)
- Explicit preference statements
- Corrections to agent behavior

### Step 2: Aggregate Evidence

For each potential pattern, collect:

- Number of supporting observations
- Recency of observations
- Strength of each observation (explicit > implicit)
- Any contradicting observations

### Step 3: Validate Pattern

A pattern is valid when:

- 3+ supporting observations (5+ for communication patterns)
- <20% contradicting observations
- Most recent observation within 30 days
- Confidence score > 0.6

**Confidence calculation:**

```
confidence = (supporting_count / (supporting_count + contradicting_count))
             * recency_factor
             * strength_factor
```

### Step 4: Store Pattern

Store validated patterns in knowledge graph:

```
Episode: {
  name: "Pattern: [brief description]",
  body: "Detected pattern: [full description]\nEvidence: [list]\nConfidence: [score]",
  sourceType: "system",
  entityTypes: { Pattern: {...} }
}
```

### Step 5: Apply Pattern

Use stored patterns to:

- Inform daily planning recommendations
- Adjust task prioritization
- Time task suggestions appropriately
- Match response style to preferences

## Pattern Lifecycle

### New Pattern

- Initial detection: 3 observations
- Low confidence (0.6-0.7)
- Applied cautiously

### Established Pattern

- 5+ observations over 2+ weeks
- Medium confidence (0.7-0.85)
- Applied regularly

### Strong Pattern

- 10+ observations over 1+ month
- High confidence (0.85+)
- Applied confidently

### Declining Pattern

- No recent supporting evidence (30+ days)
- Contradicting observations appearing
- Reduce confidence, eventually archive

### Superseded Pattern

- New pattern contradicts old one
- Mark old pattern as invalid (invalidAt timestamp)
- Create new pattern with fresh evidence

## Example Patterns

### Example 1: Morning Productivity

**Observations:**

1. Completed 3 high-energy tasks before 10am (Mon)
2. Said "I'm a morning person" in conversation
3. Completed 4 tasks before 11am (Wed)
4. Requested "what should I tackle?" at 8am (Fri)
5. Mentioned "saving easy stuff for afternoon"

**Pattern:**

```
type: temporal + energy
description: "Peak productivity 8-11am, reserves complex tasks for morning"
confidence: 0.88
```

### Example 2: Meeting Recovery

**Observations:**

1. After 3 meetings, requested "quick wins only"
2. Mentioned "need a break" after back-to-back calls
3. Scheduled buffer time after long meetings (twice)
4. Said "meetings drain me"

**Pattern:**

```
type: energy
description: "Needs recovery time after consecutive meetings"
confidence: 0.78
```

### Example 3: SMS Preference

**Observations:**

1. All quick updates sent via SMS (10+ times)
2. Email used only for brain dumps
3. Never used voice channel
4. Said "just text me"
5. Responded faster to SMS than email

**Pattern:**

```
type: communication
description: "Prefers SMS for quick interactions, email for longer content"
confidence: 0.92
```

## Important Notes

- Never announce pattern detection to user unless they ask
- Apply patterns silently to improve recommendations
- Regularly validate patterns against recent behavior
- Allow patterns to evolve—people change
- When patterns conflict, prefer more recent evidence
- Don't over-index on patterns—leave room for exceptions
