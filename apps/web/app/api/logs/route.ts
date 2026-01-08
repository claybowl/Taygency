import { NextRequest, NextResponse } from "next/server";
import { getGitHubStorage } from "@/lib/github-storage";
import type { AgentExecutionTrace } from "@vibe-planning/shared";

const LOGS_DIR = "logs";
const MAX_LOGS_TO_RETURN = 50;

export interface LogEntry {
  traceId: string;
  timestamp: string;
  channel: string;
  success: boolean;
  durationMs: number;
  llmCalls: number;
  toolCalls: number;
  tokensUsed: number;
  messagePreview: string;
}

export interface LogsApiResponse {
  logs: LogEntry[];
  total: number;
}

export interface TraceDetailResponse {
  trace: AgentExecutionTrace | null;
  error?: string;
}

function extractLogEntry(
  trace: AgentExecutionTrace,
  filename: string,
): LogEntry {
  const requestEvent = trace.logs.find(
    (l) => l.event.type === "request_received",
  );
  const eventData = requestEvent?.event as Record<string, unknown> | undefined;
  const channel = (eventData?.channel as string) || "unknown";
  const messagePreview = (eventData?.messagePreview as string) || "";

  return {
    traceId: trace.traceId,
    timestamp: trace.startTime,
    channel,
    success: trace.summary?.success ?? true,
    durationMs: trace.summary?.totalDurationMs ?? 0,
    llmCalls: trace.summary?.llmCalls ?? 0,
    toolCalls: trace.summary?.toolCalls ?? 0,
    tokensUsed: trace.summary?.tokensUsed ?? 0,
    messagePreview: messagePreview.slice(0, 100),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const traceId = searchParams.get("traceId");

  try {
    const storage = getGitHubStorage();

    if (traceId) {
      try {
        const content = await storage.readFile(`${LOGS_DIR}/${traceId}.json`);
        const trace: AgentExecutionTrace = JSON.parse(content);
        return NextResponse.json({ trace } as TraceDetailResponse);
      } catch {
        return NextResponse.json(
          { trace: null, error: "Trace not found" } as TraceDetailResponse,
          { status: 404 },
        );
      }
    }

    const files = await storage.listDirectory(LOGS_DIR);
    const jsonFiles = files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, MAX_LOGS_TO_RETURN);

    const logs: LogEntry[] = [];

    for (const file of jsonFiles) {
      try {
        const content = await storage.readFile(`${LOGS_DIR}/${file}`);
        const trace: AgentExecutionTrace = JSON.parse(content);
        logs.push(extractLogEntry(trace, file));
      } catch (err) {
        console.warn(`[Logs API] Failed to parse ${file}:`, err);
      }
    }

    logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return NextResponse.json({ logs, total: files.length } as LogsApiResponse);
  } catch (error) {
    console.error("[API /logs] Error:", error);
    return NextResponse.json({ logs: [], total: 0 } as LogsApiResponse);
  }
}

export async function POST(request: NextRequest) {
  try {
    const trace: AgentExecutionTrace = await request.json();

    if (!trace.traceId) {
      return NextResponse.json({ error: "Missing traceId" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, traceId: trace.traceId });
  } catch (error) {
    console.error("[API /logs POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to save trace" },
      { status: 500 },
    );
  }
}
