# Graphiti Knowledge Graph Integration - Debug Guide

This guide explains how messages flow from email/SMS to the Graphiti knowledge graph and how to debug when nodes aren't being created.

## Message Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Message Flow to Graph                       │
└─────────────────────────────────────────────────────────────────┘

1. Email/SMS arrives
      ↓
2. Webhook endpoint receives it
   • Email: /api/email/inbound
   • SMS:   /api/vapi/webhook
      ↓
3. processWithAgent() called
      ↓
4. AgentCore.process() runs
   • Builds context
   • Queries Graphiti for enrichment (enrichWithGraphiti)
   • Runs Claude with tools/skills
   • Generates response
      ↓
5. storeInteraction() called (if GRAPHITI_URL set)
   • Formats episode body
   • Calls Graphiti API: POST /messages
   • Graphiti extracts entities/relationships
      ↓
6. Graphiti processes message
   • Uses OpenAI to extract entities
   • Creates nodes (Person, Task, Project, etc.)
   • Creates edges (relationships)
   • Stores in Neo4j
      ↓
7. Nodes available in graph
```

## Step-by-Step Verification

### Step 1: Verify Environment Variables

Check that all required environment variables are set:

**In your Next.js app** (`apps/web/.env.local`):

```bash
GRAPHITI_URL=http://localhost:8000  # Or your production URL
OPENROUTER_API_KEY=sk-...          # For agent processing
```

**In Graphiti** (`graphiti/.env`):

```bash
OPENAI_API_KEY=sk-...                                    # For entity extraction
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io            # Your Neo4j instance
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

**Test:**

```bash
# Check Next.js can see GRAPHITI_URL
cd apps/web
npm run dev
# In browser console on localhost:3000:
fetch('/api/dashboard/memory').then(r => r.json()).then(console.log)
# Should show enabled: true
```

### Step 2: Verify Graphiti is Running

```bash
# Check containers
docker ps --filter "name=graphiti"

# Should show:
# graphiti-graph-1   Up X minutes (healthy)
# graphiti-neo4j-1   Up X minutes (healthy)

# Test health endpoint
curl http://localhost:8000/healthcheck
# Expected: {"status":"healthy"}

# Test search (should work even with no data)
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "max_facts": 5}'
# Expected: {"facts":[]}  (not an error)
```

### Step 3: Check isGraphitiEnabled()

The `storeInteraction()` function only runs if Graphiti is enabled.

**Add logging to verify** (`apps/web/lib/agent-core.ts` line 342):

```typescript
if (isGraphitiEnabled()) {
  console.log("[Agent] Storing interaction in Graphiti:", {
    userId: "default-user",
    channel: request.channel,
    messagePreview: request.message.slice(0, 50),
  });

  storeInteraction(/* ... */)
    .then(() => console.log("[Agent] ✅ Interaction stored"))
    .catch((error) => {
      console.error("[Agent] ❌ Graphiti storage failed:", error);
      logger.warn({
        /* ... */
      });
    });
} else {
  console.log("[Agent] Graphiti disabled - GRAPHITI_URL not set");
}
```

**Restart your dev server and send a test message** - check the console logs.

### Step 4: Test Direct API Call

Send a message directly to verify the webhook → agent → Graphiti flow:

**Email webhook test:**

```bash
curl -X POST http://localhost:3000/api/email/inbound \
  -F "from=test@example.com" \
  -F "subject=Test Message" \
  -F "text=I prefer morning meetings and Sarah handles the Q4 reports"
```

**Expected response:**

```json
{
  "success": true,
  "actions": 1,
  "tokensUsed": 1234
}
```

**Check Graphiti received it:**

```bash
# Wait 10-15 seconds for processing
sleep 15

# Search for the facts
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "meetings preferences", "max_facts": 10}'
```

**Expected:** Facts about morning meetings and Sarah.

### Step 5: Check Graphiti Logs

If messages aren't creating nodes, check Graphiti logs:

```bash
docker logs graphiti-graph-1 --tail 50 --follow
```

**Send a test message and watch for:**

✅ **Success pattern:**

```
INFO: Processing message for group_id: default-user
INFO: Extracted 3 entities: Person, Preference, Project
INFO: Created 3 nodes, 2 edges
INFO: 127.0.0.1 - "POST /messages HTTP/1.1" 200 OK
```

❌ **Error patterns:**

**OpenAI Authentication Error:**

```
openai.AuthenticationError: Error code: 401 - invalid_api_key
```

**Fix:** Check `OPENAI_API_KEY` in Graphiti's `.env`, restart containers.

**Neo4j Connection Error:**

```
neo4j.exceptions.AuthError: The client is unauthorized
```

**Fix:** Verify `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` in Graphiti's `.env`.

**Timeout Error:**

```
asyncio.exceptions.TimeoutError
```

**Fix:** OpenAI API may be slow, or Neo4j connection is timing out. Check network.

### Step 6: Verify Message Format

Graphiti expects messages in this format:

```typescript
POST /messages
{
  "group_id": "default-user",
  "messages": [
    {
      "content": "I prefer morning meetings and Sarah handles Q4 reports",
      "role_type": "user",
      "role": "email",
      "timestamp": "2026-01-08T10:00:00Z",
      "source_description": "Agent interaction"
    }
  ]
}
```

**Check what's being sent** - add logging to `lib/graphiti.ts` line 765:

```typescript
await client.addEpisode({
  name: `Interaction ${new Date().toISOString()}`,
  episodeBody,
  sourceType: channel as EpisodeSourceType,
  sourceDescription: "Agent interaction",
  groupId: userId,
  referenceTime: new Date(),
  entityTypes: VIBE_PLANNING_ENTITY_TYPES,
  edgeTypes: VIBE_PLANNING_EDGE_TYPES,
  edgeTypeMap: VIBE_PLANNING_EDGE_TYPE_MAP,
});

console.log("[Graphiti] Episode body sent:", episodeBody);
```

### Step 7: Check Neo4j Database Directly

Connect to Neo4j to see if nodes are being created:

1. Go to your Neo4j Aura console: https://console.neo4j.io
2. Click "Open" on your database
3. Run this query in the browser:

```cypher
// See all nodes
MATCH (n) RETURN n LIMIT 25;

// See all facts/edges
MATCH ()-[r]->() RETURN r LIMIT 25;

// See nodes created in last hour
MATCH (n)
WHERE n.created_at > datetime() - duration('PT1H')
RETURN n;

// Count nodes by label
MATCH (n) RETURN labels(n) as type, count(*) as count;
```

**Expected:** You should see nodes with labels like `Entity`, `Episode`, edges with types like `PREFERS`, `HANDLES`, etc.

**If empty:** Graphiti is not successfully writing to Neo4j.

### Step 8: Test with Simulator

Use the dashboard simulator to test the full flow:

1. Go to http://localhost:3000/dashboard
2. Click "Simulator"
3. Enter a message with clear entities:
   ```
   I need to schedule a meeting with Sarah about the Phoenix project.
   I prefer morning meetings and hate Mondays. The project deadline is March 15.
   ```
4. Click "Dispatch Trigger"
5. Wait for response
6. Click "Memory" tab
7. Refresh the page

**Expected:**

- Stats show new facts
- Graph visualization shows nodes
- Recent facts list shows extracted information

## Common Issues and Solutions

### Issue 1: "Graphiti not configured" on Memory page

**Cause:** `GRAPHITI_URL` not set or incorrect

**Solution:**

```bash
# Check .env.local
cat apps/web/.env.local | grep GRAPHITI

# Should show:
GRAPHITI_URL=http://localhost:8000

# If missing, add it:
echo "GRAPHITI_URL=http://localhost:8000" >> apps/web/.env.local

# Restart Next.js dev server
```

### Issue 2: "Connection failed" on Memory page

**Cause:** Graphiti server not running or wrong URL

**Solution:**

```bash
# Test Graphiti health
curl http://localhost:8000/healthcheck

# If connection refused:
cd graphiti
docker-compose up -d

# If wrong URL in production:
# Update GRAPHITI_URL in Vercel to match Railway/Fly URL
```

### Issue 3: Messages processed but no nodes created

**Cause:** Graphiti processing failed (usually OpenAI API issue)

**Solution:**

```bash
# Check Graphiti logs
docker logs graphiti-graph-1 --tail 100

# Look for OpenAI errors
# Verify OPENAI_API_KEY is valid
# Check OpenAI billing is active
# Regenerate key if needed

# Restart with new key:
cd graphiti
docker-compose down
# Update .env
docker-compose up -d
```

### Issue 4: Nodes created but not visible in dashboard

**Cause:**

- Different `group_id` being used
- Search query not matching
- Frontend not fetching correctly

**Solution:**

```bash
# Check what group_ids exist
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "*", "max_facts": 50}' | jq

# Check dashboard API
curl http://localhost:3000/api/dashboard/memory | jq

# Should return:
# {
#   "enabled": true,
#   "healthy": true,
#   "stats": { ... },
#   "graph": { "nodes": [...], "edges": [...] }
# }
```

### Issue 5: Webhooks not triggering

**Email:**

- Verify SendGrid inbound parse is configured
- Check SendGrid activity feed for delivery
- Test with `/api/simulator/send` instead

**SMS:**

- Verify VAPI webhook URL is correct
- Check VAPI logs for webhook delivery
- Test with simulator

## Testing Checklist

Before reporting an issue, verify:

- [ ] `GRAPHITI_URL` is set in Next.js `.env.local`
- [ ] Graphiti containers are running (`docker ps`)
- [ ] Graphiti health endpoint responds (`curl http://localhost:8000/healthcheck`)
- [ ] OpenAI API key is valid in Graphiti `.env`
- [ ] Neo4j credentials are correct in Graphiti `.env`
- [ ] Neo4j database is accessible (test in Aura console)
- [ ] Can manually add messages to Graphiti (`curl -X POST .../messages`)
- [ ] Can search Graphiti (`curl -X POST .../search`)
- [ ] Dashboard shows `enabled: true` when visiting `/api/dashboard/memory`
- [ ] Graphiti logs don't show errors (`docker logs graphiti-graph-1`)

## End-to-End Test Script

Run this to verify the complete flow:

```bash
#!/bin/bash

echo "🧪 Testing Graphiti Integration..."

# 1. Check environment
echo "📋 Checking environment variables..."
grep -q "GRAPHITI_URL" apps/web/.env.local && echo "✅ GRAPHITI_URL set" || echo "❌ GRAPHITI_URL missing"

# 2. Check Graphiti health
echo "🏥 Checking Graphiti health..."
curl -s http://localhost:8000/healthcheck | grep -q "healthy" && echo "✅ Graphiti healthy" || echo "❌ Graphiti unhealthy"

# 3. Send test message
echo "📨 Sending test message..."
RESPONSE=$(curl -s -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "test-user",
    "messages": [{
      "content": "I prefer morning meetings and Sarah handles the Q4 reports",
      "role_type": "user",
      "role": "test",
      "timestamp": "'$(date -Iseconds)'"
    }]
  }')

echo "$RESPONSE" | grep -q "success" && echo "✅ Message sent" || echo "❌ Message failed"

# 4. Wait for processing
echo "⏳ Waiting for processing..."
sleep 15

# 5. Search for facts
echo "🔍 Searching for facts..."
FACTS=$(curl -s -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "meetings preferences", "max_facts": 10}')

FACT_COUNT=$(echo "$FACTS" | jq '.facts | length')

if [ "$FACT_COUNT" -gt 0 ]; then
  echo "✅ Found $FACT_COUNT facts"
  echo "$FACTS" | jq '.facts[].fact'
else
  echo "❌ No facts found"
  echo "Check Graphiti logs: docker logs graphiti-graph-1 --tail 50"
fi

# 6. Check dashboard API
echo "🎨 Checking dashboard API..."
curl -s http://localhost:3000/api/dashboard/memory | jq '.enabled, .healthy, .stats' && echo "✅ Dashboard API working" || echo "❌ Dashboard API failed"

echo "✨ Test complete!"
```

Save as `test-graphiti.sh`, make executable (`chmod +x test-graphiti.sh`), and run.

## Debug Mode

Enable detailed logging:

**In `apps/web/lib/graphiti.ts`:**

```typescript
export function getGraphitiClient(): GraphitiClient {
  if (!clientInstance) {
    const url = process.env.GRAPHITI_URL || "http://localhost:8000";
    console.log("[Graphiti] Initializing client with URL:", url);
    clientInstance = new GraphitiClient({
      baseUrl: url,
      apiKey: process.env.GRAPHITI_API_KEY,
      timeout: 30000,
    });
  }
  return clientInstance;
}

export function isGraphitiEnabled(): boolean {
  const enabled = !!process.env.GRAPHITI_URL;
  console.log("[Graphiti] Enabled:", enabled, "URL:", process.env.GRAPHITI_URL);
  return enabled;
}
```

**In `apps/web/lib/agent-core.ts` (line 120):**

```typescript
if (isGraphitiEnabled()) {
  try {
    console.log("[Agent] Enriching with Graphiti...");
    graphitiContext = await enrichWithGraphiti(/*...*/);
    console.log("[Agent] Graphiti enrichment result:", {
      facts: graphitiContext.facts.length,
      patterns: graphitiContext.patterns.length,
    });
  } catch (error) {
    console.error("[Agent] Graphiti enrichment error:", error);
  }
}
```

## Getting Help

If nodes still aren't being created after following this guide:

1. **Collect logs:**

   ```bash
   docker logs graphiti-graph-1 > graphiti-logs.txt
   docker logs graphiti-neo4j-1 > neo4j-logs.txt
   ```

2. **Test the exact API call:**

   ```bash
   curl -v -X POST http://localhost:8000/messages \
     -H "Content-Type: application/json" \
     -d @test-message.json > api-response.txt 2>&1
   ```

3. **Check Neo4j query:**
   Run `MATCH (n) RETURN n LIMIT 25` in Neo4j Browser

4. **Share:**
   - Graphiti logs
   - Neo4j query results
   - API response
   - Your environment variables (redact sensitive values)

---

_Last updated: January 2026_
