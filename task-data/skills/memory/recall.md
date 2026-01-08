---
name: recall
version: "1.0"
trigger: User asks about past conversations, preferences, related context, or when context would improve the response
---

# Skill: Recall

Query the knowledge graph for relevant context before responding to improve personalization and accuracy.

## When to Trigger

- User explicitly asks: "Do you remember...?", "What did I tell you about...?"
- User references past context: "Like I mentioned before...", "Remember when...?"
- Context would significantly improve response quality (related tasks, people, patterns)
- User asks for recommendations that should consider their history

## Process

### Step 1: Identify Query Intent

Determine what type of context to retrieve:

**Direct recall:** User explicitly asking for remembered information

- "What do you know about my work habits?"
- "Do you remember Sarah's role?"

**Contextual recall:** Background context that would improve the response

- "Help me plan my morning" → recall morning productivity patterns
- "What should I do about the report?" → recall related tasks, people, deadlines

**Entity lookup:** Finding specific information

- "What tasks are related to Phoenix project?"
- "When is mom's birthday?"

### Step 2: Formulate Search Queries

Build appropriate search queries for Graphiti:

**For people:** Include name, role keywords, relationship terms
**For projects:** Include project name, related task terms
**For patterns:** Include temporal terms, habit keywords, preference indicators
**For preferences:** Include preference type, domain (scheduling, communication, etc.)

Use the user's node as the center for distance-based reranking.

### Step 3: Filter and Prioritize Results

From search results, prioritize:

1. **Recency:** More recent information is usually more relevant
2. **Relevance score:** Higher confidence/similarity scores
3. **Temporal validity:** Facts that are still valid (check validAt/invalidAt)
4. **Direct vs. inferred:** Explicitly stated facts over inferred patterns

### Step 4: Synthesize into Response

Present recalled information naturally:

**Good synthesis:**

> "Based on what you've told me, you're most productive in the morning—especially for deep work. You mentioned that Mondays are usually packed with meetings, so Tuesday or Wednesday morning might be better for tackling that report. Also, Sarah mentioned she needs the draft by Thursday."

**Bad synthesis:**

> "Query results: 1) User prefers morning work (confidence: 0.85), 2) Mondays are busy (valid_at: 2024-01-15), 3) Sarah deadline Thursday (source: email)..."

## Query Patterns

### Pattern 1: Direct Question About Memory

**User:** "What do you know about my meeting preferences?"

**Queries:**

- "meeting preferences scheduling"
- "prefers avoids meetings"
- "calendar schedule time"

**Response focus:** Stated preferences about meetings

### Pattern 2: Reference to Past Conversation

**User:** "Remember when I told you about the vacation planning?"

**Queries:**

- "vacation planning trip travel"
- "time off holiday"

**Response focus:** The specific conversation/context mentioned

### Pattern 3: Entity Relationship Lookup

**User:** "What tasks are related to Sarah?"

**Queries:**

- "Sarah tasks assigned involves"
- "Sarah project work"

**Response focus:** Tasks, projects, or responsibilities linked to Sarah

### Pattern 4: Pattern/Habit Inquiry

**User:** "When am I usually most productive?"

**Queries:**

- "productive energy focus morning afternoon"
- "best time work deep"
- "productivity pattern habit"

**Response focus:** Temporal patterns, energy levels, productivity observations

### Pattern 5: Contextual Enhancement

**User:** "Help me plan tomorrow"

**Queries:**

- "tomorrow schedule tasks due"
- "productivity patterns energy levels"
- "preferences planning daily"

**Response focus:** Relevant tasks, patterns, and preferences for planning

## Response Format

### When Context is Found

Integrate recalled information naturally into your response. Don't list facts—weave them into helpful guidance.

### When Context is Partial

Acknowledge what you know and what you don't:

> "I remember you mentioned preferring morning meetings, but I don't have details about your Thursday availability. Want to tell me more?"

### When No Context Found

Be honest but helpful:

> "I don't have any saved information about that yet. Want to tell me so I can remember for next time?"

## Important Notes

- Always use the user's node as the center for searches (better relevance)
- Consider temporal validity—some facts expire or get superseded
- Don't invent or hallucinate recalled information
- Combine with current context (active tasks, recent messages) for best results
- If recall fails silently, continue without mentioning it
