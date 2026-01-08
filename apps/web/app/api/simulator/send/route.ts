import { NextRequest, NextResponse } from "next/server";
import type {
  AgentResponse,
  AgentAction,
  AgentExecutionTrace,
  AgentLogEntry,
} from "@vibe-planning/shared";
import { getGitHubStorage } from "@/lib/github-storage";

const LOGS_DIR = "logs";

interface SimulatorRequest {
  channel: "email" | "sms";
  message: string;
  context?: {
    from?: string;
    subject?: string;
    phoneNumber?: string;
  };
}

function createMockTrace(
  channel: string,
  message: string,
): AgentExecutionTrace {
  const now = new Date();
  const traceId = `mock-trace-${Date.now()}`;

  const logs: AgentLogEntry[] = [
    {
      id: `log-${Date.now()}-1`,
      timestamp: now.toISOString(),
      level: "info",
      event: {
        type: "request_received",
        channel: channel as "email" | "sms",
        messagePreview: message.slice(0, 100),
      },
      durationMs: 0,
    },
    {
      id: `log-${Date.now()}-2`,
      timestamp: new Date(now.getTime() + 10).toISOString(),
      level: "warn",
      event: {
        type: "error",
        message: "GitHub credentials not configured - using mock response",
      },
      durationMs: 10,
    },
    {
      id: `log-${Date.now()}-3`,
      timestamp: new Date(now.getTime() + 50).toISOString(),
      level: "info",
      event: {
        type: "response_generated",
        messageLength: 150,
        actionCount: 0,
      },
      durationMs: 40,
    },
  ];

  return {
    traceId,
    startTime: now.toISOString(),
    endTime: new Date(now.getTime() + 50).toISOString(),
    logs,
    summary: {
      totalDurationMs: 50,
      llmCalls: 0,
      toolCalls: 0,
      tokensUsed: 0,
      success: false,
    },
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
      const { response: agentResponse, trace } = await processWithAgent({
        channel,
        message,
        context: {
          subject: context.subject,
          phoneNumber: context.phoneNumber,
        },
      });

      await persistTrace(trace);

      return NextResponse.json({
        success: true,
        response: agentResponse,
        trace,
      });
    } catch (agentError) {
      console.warn(
        "[Simulator] Agent failed, using mock response:",
        agentError,
      );
      const mockResponse = getMockResponse(channel, message);
      const mockTrace = createMockTrace(channel, message);

      await persistTrace(mockTrace);

      return NextResponse.json({
        success: true,
        response: mockResponse,
        trace: mockTrace,
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

async function persistTrace(trace: AgentExecutionTrace): Promise<void> {
  try {
    const storage = getGitHubStorage();

    const logsExist = await storage.exists(`${LOGS_DIR}/.gitkeep`);
    if (!logsExist) {
      await storage.writeFile(
        `${LOGS_DIR}/.gitkeep`,
        "",
        "Initialize logs directory",
      );
    }

    const filename = `${trace.traceId}.json`;
    await storage.writeFile(
      `${LOGS_DIR}/${filename}`,
      JSON.stringify(trace, null, 2),
      `Add execution trace ${trace.traceId}`,
    );
  } catch (err) {
    console.warn("[Simulator] Failed to persist trace:", err);
  }
}
