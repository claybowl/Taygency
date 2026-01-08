# 📞 Vapi Phone Agent Deployment Guide

> Complete guide to setting up Vapi voice integration for Vibe Planning

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Part 1: Vapi Account Setup](#part-1-vapi-account-setup)
- [Part 2: Environment Configuration](#part-2-environment-configuration)
- [Part 3: Voice Selection](#part-3-voice-selection)
- [Part 4: Assistant Configuration](#part-4-assistant-configuration)
- [Part 5: Webhook Implementation](#part-5-webhook-implementation)
- [Part 6: Tool Definitions](#part-6-tool-definitions)
- [Part 7: Context Engineering](#part-7-context-engineering)
- [Part 8: Local Development](#part-8-local-development)
- [Part 9: Production Deployment](#part-9-production-deployment)
- [Part 10: Testing & Validation](#part-10-testing--validation)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

---

## Overview

This guide walks you through integrating Vapi voice AI with Vibe Planning, enabling Taylor to manage tasks via phone calls.

### What You're Building

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│   Phone     │────▶│    VAPI     │────▶│   Vibe Planning     │
│   Call      │     │ Orchestrator│     │   /api/vapi/webhook │
└─────────────┘     └─────────────┘     └─────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌─────────┐  ┌─────────┐
         │  STT   │  │   LLM   │  │   TTS   │
         │(Listen)│  │ (Think) │  │ (Speak) │
         └────────┘  └─────────┘  └─────────┘
```

### Key Features

- 📞 Inbound calls to check tasks, create tasks, get briefings
- 🎯 Context-aware responses based on time of day and task state
- 🔧 Tool integration with existing Vibe Planning agent
- 📊 Call logging to knowledge graph for memory

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Vibe Planning app running locally or deployed
- [ ] GitHub token configured (for workspace access)
- [ ] OpenRouter API key configured

---

## Part 1: Vapi Account Setup

### Step 1: Create Account

1. Go to [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Sign up for an account
3. You'll receive **$10 in free credits** (~30-75 minutes of calls)

### Step 2: Get API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Copy and save the key securely

### Step 3: Buy a Phone Number

1. Go to **Phone Numbers** in the sidebar
2. Click **Buy Number**
3. Select your preferred area code
4. Cost: ~$2/month + per-minute usage

### Step 4: Note Your Phone Number ID

After purchasing, note the Phone Number ID - you'll need it for configuration.

---

## Part 2: Environment Configuration

Add these variables to your `.env.local`:

```env
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id
VAPI_PHONE_NUMBER=+1234567890

# Optional: Webhook secret for authentication
VAPI_WEBHOOK_SECRET=your_webhook_secret
```

The voice channel is already supported in the shared types:

```typescript
export type Channel = "email" | "sms" | "voice" | "app";
```

---

## Part 3: Voice Selection

Vapi offers 10 native voices. For the energetic "let's get things done" vibe:

### Recommended Voices

| Voice       | Gender | Age | Characteristics                 | Best For               |
| ----------- | ------ | --- | ------------------------------- | ---------------------- |
| **Harry**   | Male   | 24  | Clear, energetic, professional  | Primary recommendation |
| **Spencer** | Female | 26  | Energetic, quippy, lighthearted | Fun & motivating       |
| **Rohan**   | Male   | 24  | Bright, optimistic, cheerful    | Morning energy         |
| **Lily**    | Female | 25  | Bright, bubbly, cheerful        | Upbeat interactions    |

### Alternative (Calmer) Voices

| Voice        | Gender | Age | Characteristics                    |
| ------------ | ------ | --- | ---------------------------------- |
| **Elliot**   | Male   | 25  | Soothing, friendly, professional   |
| **Paige**    | Female | 26  | Deeper tone, calming, professional |
| **Cole**     | Male   | 22  | Deeper tone, calming, professional |
| **Hana**     | Female | 22  | Soft, soothing, gentle             |
| **Neha**     | Female | 30  | Professional, charming             |
| **Savannah** | Female | 25  | Southern American accent           |

### Voice Configuration

```json
{
  "voice": {
    "provider": "vapi",
    "voiceId": "harry"
  }
}
```

---

## Part 4: Assistant Configuration

### Option A: Vapi-Managed LLM (Simpler)

Vapi handles the AI conversation; your webhook provides context and tools.

**Create in Dashboard:**

1. Go to **Assistants** → **Create Assistant**
2. Configure:

```
Name: Vibe Planning Assistant
First Message: Alright, let's get the day started. Good morning, Taylor. Are you ready to go?
```

**System Prompt:**

```
You are Vibe Planning, Taylor's personal AI task management assistant available by phone.

## Your Personality
- Energetic and motivating, but not overwhelming
- Efficient and action-oriented - you get things done
- Casual and friendly - use contractions, speak naturally
- Encouraging without being cheesy

## What You Can Do
- Tell Taylor about their active tasks
- Create new tasks from voice input
- Mark tasks as complete
- Suggest what to work on next based on priority
- Give quick daily briefings

## Voice Response Rules (CRITICAL)
- Keep responses to 2-3 sentences MAX
- Say numbers as words ("five tasks" not "5 tasks")
- For lists: give maximum 3 items, then ask "want me to continue?"
- Always end with a clear question or next action
- Use natural speech patterns ("gonna", "wanna", "let's" are great)
- Pause naturally - don't rush through information

## Never Do This
- Never say URLs, file paths, or code
- Never use markdown formatting (no asterisks, bullets, etc.)
- Never give long explanations - be punchy
- Never say "as an AI" or break character
- Never read out technical error messages - just say "that didn't work, let's try again"

## Context
- User: Taylor Brown
- Timezone: America/Chicago
- This is a task management system stored in GitHub
- Tasks have priorities (high, medium, low) and categories

## Example Exchanges

User: "What do I have today?"
You: "You've got five tasks on deck. Top priority is the quarterly report, that's due tomorrow. You also have a call with Jim at two. Want me to run through the others?"

User: "Add a task to email Sarah about the budget"
You: "Got it! Added 'email Sarah about the budget' as medium priority. Want me to bump it to high?"

User: "I finished the report"
You: "Nice work! Marked the quarterly report as done. That was your big one today. What's next?"

User: "What should I work on?"
You: "I'd tackle the marketing deck next - it's high priority and you've got a clear block before your two o'clock. Sound good?"

## Greeting Behavior
Adapt your energy to the time of day:
- Morning: Energetic, "let's crush it" vibe
- Afternoon: Check-in energy, "how's it going" vibe
- Evening: Winding down, "let's wrap up" vibe
```

**Model Settings:**

```json
{
  "model": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7
  }
}
```

**Voice Settings:**

```json
{
  "voice": {
    "provider": "vapi",
    "voiceId": "harry"
  }
}
```

**Server URL:**

```
https://your-app.vercel.app/api/vapi/webhook
```

### Option B: Your Backend as LLM (Full Power)

Your existing AgentCore handles all conversation logic.

```json
{
  "model": {
    "provider": "custom-llm",
    "url": "https://your-app.vercel.app/api/vapi/conversation"
  }
}
```

### Assigning to Phone Number

1. Go to **Phone Numbers**
2. Select your number
3. Set **Assistant** to your created assistant
4. Set **Server URL** to your webhook endpoint

---

## Part 5: Webhook Implementation

### Current Webhook Location

`apps/web/app/api/vapi/webhook/route.ts`

### Enhanced Webhook Structure

```typescript
import { NextRequest, NextResponse } from "next/server";
import { processWithAgent } from "@/lib/agent";
import { getGitHubStorage } from "@/lib/github-storage";

// Webhook event types
type VapiEventType =
  | "assistant-request"
  | "conversation-update"
  | "tool-calls"
  | "end-of-call-report"
  | "status-update"
  | "hang"
  | "transcript";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const messageType = payload.message?.type as VapiEventType;

    console.log(`[VAPI Webhook] Received: ${messageType}`);

    switch (messageType) {
      case "assistant-request":
        return handleAssistantRequest(payload);

      case "conversation-update":
        return handleConversationUpdate(payload);

      case "tool-calls":
        return handleToolCalls(payload);

      case "end-of-call-report":
        return handleEndOfCall(payload);

      case "status-update":
        return handleStatusUpdate(payload);

      case "hang":
        console.log("[VAPI] Assistant hung (no response delay)");
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("[VAPI Webhook] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: assistant-request
// Called when call starts - MUST respond within 7.5 seconds!
// ═══════════════════════════════════════════════════════════════
async function handleAssistantRequest(payload: any) {
  const phoneNumber = payload.message?.call?.customer?.number;

  // Get current time for greeting
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  // Load task context (keep this fast!)
  let taskCount = 0;
  let topTask = "your tasks";

  try {
    const storage = getGitHubStorage();
    const tasks = await storage.listDirectory("tasks/active");
    taskCount = tasks.filter((f) => f.endsWith(".md")).length;
  } catch (error) {
    console.warn("[VAPI] Could not load task context:", error);
  }

  // Time-aware first messages
  const firstMessages: Record<string, string> = {
    morning:
      "Alright, let's get the day started. Good morning, Taylor. Are you ready to go?",
    afternoon:
      "Hey Taylor! How's the day going? What can I help you knock out?",
    evening: "Hey Taylor, winding down? Let's see what's left on the list.",
  };

  return NextResponse.json({
    assistantOverrides: {
      firstMessage: firstMessages[timeOfDay],
      variableValues: {
        userName: "Taylor",
        taskCount: String(taskCount),
        timeOfDay: timeOfDay,
        topTask: topTask,
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: conversation-update
// Called when user speaks (for logging/processing)
// ═══════════════════════════════════════════════════════════════
async function handleConversationUpdate(payload: any) {
  const messages = payload.message?.messages || [];
  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.role === "user") {
    console.log("[VAPI] User said:", lastMessage.content?.slice(0, 100));
  }

  return NextResponse.json({ success: true });
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: tool-calls
// Execute tools requested by the assistant
// ═══════════════════════════════════════════════════════════════
async function handleToolCalls(payload: any) {
  const toolCalls = payload.message?.toolCallList || [];
  const results: Array<{ toolCallId: string; result: string }> = [];

  for (const toolCall of toolCalls) {
    const { id, name, arguments: args } = toolCall;

    console.log(`[VAPI] Tool call: ${name}`, args);

    let result: string;

    try {
      switch (name) {
        case "get_todays_tasks":
          result = await getTasksSummaryForVoice();
          break;

        case "create_task":
          result = await createTaskFromVoice(args?.title, args?.priority);
          break;

        case "complete_task":
          result = await completeTaskByName(args?.taskName);
          break;

        case "get_next_task":
          result = await getNextTaskRecommendation();
          break;

        default:
          result = `I don't know how to ${name} yet.`;
      }
    } catch (error) {
      console.error(`[VAPI] Tool ${name} failed:`, error);
      result = "Sorry, I couldn't complete that action.";
    }

    results.push({ toolCallId: id, result });
  }

  return NextResponse.json({ results });
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: end-of-call-report
// Log call summary for analytics and memory
// ═══════════════════════════════════════════════════════════════
async function handleEndOfCall(payload: any) {
  const { endedReason, artifact } = payload.message || {};
  const { transcript, messages } = artifact || {};

  console.log("[VAPI] Call ended:", {
    reason: endedReason,
    messageCount: messages?.length || 0,
    transcriptLength: transcript?.length || 0,
  });

  // TODO: Store in knowledge graph for memory
  // await storeCallInGraphiti(payload);

  return NextResponse.json({ success: true });
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: status-update
// Track call lifecycle
// ═══════════════════════════════════════════════════════════════
async function handleStatusUpdate(payload: any) {
  const status = payload.message?.status;
  console.log("[VAPI] Status update:", status);

  return NextResponse.json({ success: true });
}

// ═══════════════════════════════════════════════════════════════
// TOOL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

async function getTasksSummaryForVoice(): Promise<string> {
  try {
    const storage = getGitHubStorage();
    const taskFiles = await storage.listDirectory("tasks/active");
    const tasks = taskFiles.filter((f) => f.endsWith(".md"));

    if (tasks.length === 0) {
      return "You have no active tasks. Nice work, or time to add some!";
    }

    // Get first 3 task titles
    const taskSummaries: string[] = [];
    for (const taskFile of tasks.slice(0, 3)) {
      try {
        const content = await storage.readFile(`tasks/active/${taskFile}`);
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          taskSummaries.push(titleMatch[1]);
        }
      } catch {
        // Skip unreadable tasks
      }
    }

    const count = tasks.length;
    const summary = taskSummaries.join(", ");
    const more = count > 3 ? ` and ${count - 3} more` : "";

    return `You have ${count} active tasks. Top ones are: ${summary}${more}.`;
  } catch (error) {
    console.error("[VAPI] getTasksSummaryForVoice failed:", error);
    return "I had trouble loading your tasks. Try again in a moment.";
  }
}

async function createTaskFromVoice(
  title?: string,
  priority?: string,
): Promise<string> {
  if (!title) {
    return "I didn't catch the task name. What would you like to add?";
  }

  try {
    const { response } = await processWithAgent({
      channel: "voice",
      message: `Create a task: ${title}${priority ? ` with ${priority} priority` : ""}`,
      context: {},
    });

    return `Done! I've added "${title}" to your tasks.`;
  } catch (error) {
    console.error("[VAPI] createTaskFromVoice failed:", error);
    return "I couldn't create that task. Want to try again?";
  }
}

async function completeTaskByName(taskName?: string): Promise<string> {
  if (!taskName) {
    return "Which task did you complete?";
  }

  try {
    const { response } = await processWithAgent({
      channel: "voice",
      message: `Mark the task "${taskName}" as complete`,
      context: {},
    });

    return `Nice work! I've marked "${taskName}" as complete.`;
  } catch (error) {
    console.error("[VAPI] completeTaskByName failed:", error);
    return "I couldn't find that task. Can you be more specific?";
  }
}

async function getNextTaskRecommendation(): Promise<string> {
  try {
    const { response } = await processWithAgent({
      channel: "voice",
      message: "What should I work on next? Give me one task recommendation.",
      context: {},
    });

    // Extract just the recommendation, keep it short
    const message = response.message;
    if (message.length > 200) {
      return message.slice(0, 200) + "...";
    }
    return message;
  } catch (error) {
    console.error("[VAPI] getNextTaskRecommendation failed:", error);
    return "Check your highest priority task and start there!";
  }
}
```

---

## Part 6: Tool Definitions

Define these tools in the Vapi Dashboard under your assistant's **Tools** section:

### Tool 1: Get Today's Tasks

```json
{
  "type": "function",
  "function": {
    "name": "get_todays_tasks",
    "description": "Get a voice-friendly summary of today's active tasks. Use when user asks about their tasks, what they have to do, or wants a briefing.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
}
```

### Tool 2: Create Task

```json
{
  "type": "function",
  "function": {
    "name": "create_task",
    "description": "Create a new task from voice input. Use when user wants to add, create, or remember a task.",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "The task title or description"
        },
        "priority": {
          "type": "string",
          "enum": ["high", "medium", "low"],
          "description": "Task priority level. Default to medium if not specified."
        }
      },
      "required": ["title"]
    }
  }
}
```

### Tool 3: Complete Task

```json
{
  "type": "function",
  "function": {
    "name": "complete_task",
    "description": "Mark a task as done. Use when user says they finished, completed, or done with a task.",
    "parameters": {
      "type": "object",
      "properties": {
        "taskName": {
          "type": "string",
          "description": "The name or description of the task to complete. Partial matches are OK."
        }
      },
      "required": ["taskName"]
    }
  }
}
```

### Tool 4: Get Next Task

```json
{
  "type": "function",
  "function": {
    "name": "get_next_task",
    "description": "Get a recommendation for what to work on next based on priority and context. Use when user asks what to do, what's next, or needs guidance.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
}
```

---

## Part 7: Context Engineering

### Context Injection Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: SYSTEM PROMPT (Always Present)                    │
│  ├── Identity (Vibe Planning assistant)                     │
│  ├── User (Taylor Brown)                                    │
│  ├── Personality (Energetic, efficient)                     │
│  └── Response rules (Short, natural)                        │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: CALL-START INJECTION (assistant-request)          │
│  ├── Time of day → Greeting style                           │
│  ├── Task count → Overview                                  │
│  ├── Top 3 tasks → Quick context                            │
│  └── Calendar events → Scheduling awareness                 │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: ON-DEMAND (Tool Calls)                            │
│  ├── Full task list → When asked                            │
│  ├── Task details → When discussing specific task           │
│  └── Recommendations → Smart scheduling                     │
└─────────────────────────────────────────────────────────────┘
```

### Variable Values

Inject these via `assistantOverrides.variableValues`:

```typescript
const variableValues = {
  userName: "Taylor",
  timeOfDay: "morning", // morning | afternoon | evening
  currentDate: "Tuesday, January 8th",
  taskCount: "5",
  highPriorityCount: "2",
  topTask: "Quarterly report - due tomorrow",
};
```

Reference in system prompt:

```
You're helping {{userName}}. It's {{timeOfDay}} on {{currentDate}}.
They have {{taskCount}} tasks, {{highPriorityCount}} are high priority.
```

### Voice Response Guidelines

Include in system prompt:

```
## Voice Response Rules
- Maximum 2-3 sentences per response
- Use natural speech ("gonna", "wanna" are fine)
- Numbers: say "five" not "5"
- Lists: maximum 3 items, then offer to continue
- Always end with a clear next step or question
- Never say: URLs, code, file paths, technical jargon
- Pause naturally between thoughts
```

---

## Part 8: Local Development

### Option 1: ngrok + Vapi CLI

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Create public tunnel
ngrok http 3000
# Note the https://xxx.ngrok.io URL

# Terminal 3: (Optional) Vapi webhook forwarder
npx vapi listen --forward-to localhost:3000/api/vapi/webhook
```

Update your Vapi assistant's Server URL to the ngrok URL:

```
https://abc123.ngrok.io/api/vapi/webhook
```

### Option 2: Dashboard Testing

1. Go to your Assistant in Vapi Dashboard
2. Click **"Talk to Assistant"**
3. Test conversation without using phone minutes

### Test Scenarios

| Scenario    | What to Say              | Expected                  |
| ----------- | ------------------------ | ------------------------- |
| Greeting    | (just call)              | Time-appropriate greeting |
| Task list   | "What's on my plate?"    | Lists top 3 tasks         |
| Create task | "Add a task to call mom" | Confirms creation         |
| Complete    | "I finished the report"  | Marks complete            |
| Next task   | "What should I do?"      | Recommendation            |

---

## Part 9: Production Deployment

### Vercel Deployment

1. Ensure environment variables are set in Vercel:
   - `VAPI_API_KEY`
   - `VAPI_PHONE_NUMBER_ID`
   - `VAPI_PHONE_NUMBER`

2. Deploy:

```bash
vercel --prod
```

3. Update Vapi Dashboard:
   - Set Server URL to `https://your-app.vercel.app/api/vapi/webhook`
   - Test with a real phone call

### Webhook URL Configuration

Set at the **Phone Number** level for production:

1. Go to **Phone Numbers** → Select your number
2. Set **Server URL**: `https://your-app.vercel.app/api/vapi/webhook`
3. Save

---

## Part 10: Testing & Validation

### Pre-Launch Checklist

- [ ] Environment variables configured
- [ ] Webhook responds to `assistant-request` within 7.5 seconds
- [ ] Tools execute and return results
- [ ] Voice sounds natural (test greeting)
- [ ] Error handling works gracefully

### Test Call Script

```
1. Call your Vapi number
2. Listen for personalized greeting
3. Ask: "What do I have today?"
4. Say: "Add a task to review the slides"
5. Say: "I finished reviewing slides"
6. Ask: "What should I do next?"
7. Say: "Thanks, bye!"
```

### Monitoring

Check the Vapi Dashboard **Logs** section for:

- Call duration
- Transcripts
- Tool call success/failure
- Error messages

---

## Troubleshooting

### Common Issues

| Issue                      | Cause                         | Solution               |
| -------------------------- | ----------------------------- | ---------------------- |
| "Assistant not responding" | Webhook timeout               | Ensure response < 7.5s |
| "Tool call failed"         | Server error                  | Check webhook logs     |
| No greeting customization  | assistant-request not handled | Verify webhook handler |
| Voice sounds robotic       | Wrong provider                | Use `provider: "vapi"` |

### Webhook Debugging

Add detailed logging:

```typescript
console.log("[VAPI] Received:", JSON.stringify(payload, null, 2));
```

Check Vercel function logs:

```bash
vercel logs --follow
```

### Timeout Issues

The `assistant-request` event MUST respond within 7.5 seconds. If loading context is slow:

1. Cache frequently accessed data
2. Load minimal context at call start
3. Use tools for detailed data fetching

---

## Cost Estimation

### Per-Minute Breakdown

| Component         | Cost/Minute     |
| ----------------- | --------------- |
| Vapi Platform     | $0.05           |
| Telephony         | $0.01           |
| STT (Deepgram)    | $0.01           |
| LLM (GPT-4o-mini) | $0.02-0.05      |
| TTS (Vapi native) | $0.01           |
| **Total**         | **~$0.10-0.13** |

### Monthly Estimates

| Usage                            | Minutes | Cost      |
| -------------------------------- | ------- | --------- |
| Light (5 calls/day, 2 min avg)   | 300     | ~$30-40   |
| Medium (10 calls/day, 2 min avg) | 600     | ~$60-80   |
| Heavy (20 calls/day, 3 min avg)  | 1,800   | ~$180-240 |

### Cost Optimization

- Use Vapi native voices (cheaper than 11Labs)
- Use GPT-4o-mini instead of GPT-4
- Keep calls focused and short via good UX design
- Cache context to reduce LLM tokens

---

## Next Steps

After basic setup:

1. **Outbound Calls**: Morning briefing calls
2. **Analytics**: Build call dashboard
3. **Memory**: Log calls to knowledge graph
4. **Multi-user**: Support caller identification

---

## Resources

- [Vapi Documentation](https://docs.vapi.ai)
- [Vapi Dashboard](https://dashboard.vapi.ai)
- [Server URL Events](https://docs.vapi.ai/server-url/events)
- [Custom Tools](https://docs.vapi.ai/tools/custom-tools)

---

_Last updated: January 2025_
