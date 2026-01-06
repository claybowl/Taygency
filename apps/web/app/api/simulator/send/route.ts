import { NextRequest, NextResponse } from "next/server";
import type { AgentResponse, AgentAction } from "@vibe-planning/shared";

interface SimulatorRequest {
  channel: "email" | "sms";
  message: string;
  context?: {
    from?: string;
    subject?: string;
    phoneNumber?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: SimulatorRequest = await req.json();

    const { channel, message, context = {} } = body;

    if (!channel || !message) {
      return NextResponse.json(
        { error: "Missing channel or message" },
        { status: 400 },
      );
    }

    if (channel !== "email" && channel !== "sms") {
      return NextResponse.json(
        { error: "Invalid channel. Must be 'email' or 'sms'" },
        { status: 400 },
      );
    }

    try {
      const { processWithAgent } = await import("@/lib/agent");
      const agentResponse = await processWithAgent({
        channel,
        message,
        context: {
          subject: context.subject,
          phoneNumber: context.phoneNumber,
        },
      });

      return NextResponse.json({
        success: true,
        response: agentResponse,
      });
    } catch (agentError) {
      console.warn(
        "[Simulator] Agent failed, using mock response:",
        agentError,
      );
      // Return a mock response when agent fails (e.g., no GitHub credentials)
      const mockResponse = getMockResponse(channel, message);
      return NextResponse.json({
        success: true,
        response: mockResponse,
        mock: true,
      });
    }
  } catch (error) {
    console.error("[Simulator] Error:", error);
    return NextResponse.json(
      {
        error: "Processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getMockResponse(channel: string, message: string): AgentResponse {
  const lowerMessage = message.toLowerCase();

  // Detect intent from message
  let intent = "general";
  if (
    lowerMessage.includes("reschedule") ||
    lowerMessage.includes("schedule") ||
    lowerMessage.includes("when")
  ) {
    intent = "scheduling";
  } else if (
    lowerMessage.includes("add") ||
    lowerMessage.includes("create") ||
    lowerMessage.includes("new task")
  ) {
    intent = "task_creation";
  } else if (
    lowerMessage.includes("what should i do") ||
    lowerMessage.includes("prioritize") ||
    lowerMessage.includes("what to do")
  ) {
    intent = "prioritization";
  } else if (
    lowerMessage.includes("complete") ||
    lowerMessage.includes("done") ||
    lowerMessage.includes("finish")
  ) {
    intent = "completion";
  }

  // Generate response based on intent
  let responseMessage = "";
  const actions: AgentAction[] = [];

  switch (intent) {
    case "scheduling":
      responseMessage = `I've analyzed your request about scheduling. Based on your patterns, I'd recommend looking at your calendar to find a good time slot. The system is ready to help you schedule once GitHub credentials are configured.`;
      break;
    case "task_creation":
      responseMessage = `Got it - I understand you want to create a new task. The task management system is ready to organize this for you once connected to GitHub storage.`;
      actions.push({
        type: "task_created",
        taskId: `sim-task-${Date.now()}`,
        title: message.slice(0, 50) + "...",
      });
      break;
    case "prioritization":
      responseMessage = `Here's what I recommend based on your priorities:\n\n1. Review upcoming deadlines\n2. Check energy levels for the day\n3. Focus on high-impact items first\n\n(Dashboard connected - full AI prioritization available with GitHub credentials)`;
      break;
    case "completion":
      responseMessage = `Understood - I've noted that task as complete in the simulator. Full task management is available when connected to GitHub.`;
      actions.push({
        type: "task_completed",
        taskId: `sim-task-old`,
      });
      break;
    default:
      responseMessage = `I've received your message: "${message.slice(0, 100)}${message.length > 100 ? "..." : ""}"\n\nThe AI agent is ready to process this once GitHub storage is configured. For now, this simulator demonstrates the message flow.`;
  }

  return {
    success: true,
    message: responseMessage,
    actions,
    metadata: {
      tokensUsed: 0,
      processingTimeMs: 0,
      skillsExecuted: [],
    },
  };
}
