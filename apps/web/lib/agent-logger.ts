import type {
  AgentLogEntry,
  AgentLogLevel,
  AgentLogEvent,
  AgentExecutionTrace,
} from "@vibe-planning/shared";

export class AgentLogger {
  private logs: AgentLogEntry[] = [];
  private traceId: string;
  private startTime: Date;
  private lastTimestamp: number;

  constructor() {
    this.traceId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.startTime = new Date();
    this.lastTimestamp = Date.now();
  }

  private generateId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private log(level: AgentLogLevel, event: AgentLogEvent): AgentLogEntry {
    const now = Date.now();
    const entry: AgentLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      event,
      durationMs: now - this.lastTimestamp,
    };
    this.lastTimestamp = now;
    this.logs.push(entry);
    return entry;
  }

  debug(event: AgentLogEvent): AgentLogEntry {
    return this.log("debug", event);
  }

  info(event: AgentLogEvent): AgentLogEntry {
    return this.log("info", event);
  }

  warn(event: AgentLogEvent): AgentLogEntry {
    return this.log("warn", event);
  }

  error(event: AgentLogEvent): AgentLogEntry {
    return this.log("error", event);
  }

  getTrace(): AgentExecutionTrace {
    const endTime = new Date();
    const totalDurationMs = endTime.getTime() - this.startTime.getTime();

    let llmCalls = 0;
    let toolCalls = 0;
    let tokensUsed = 0;
    let hasError = false;

    for (const log of this.logs) {
      if (log.event.type === "llm_request_complete") {
        llmCalls++;
        tokensUsed += log.event.promptTokens + log.event.completionTokens;
      }
      if (log.event.type === "tool_call_start") {
        toolCalls++;
      }
      if (log.event.type === "error") {
        hasError = true;
      }
    }

    return {
      traceId: this.traceId,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      logs: this.logs,
      summary: {
        totalDurationMs,
        llmCalls,
        toolCalls,
        tokensUsed,
        success: !hasError,
      },
    };
  }

  getLogs(): AgentLogEntry[] {
    return [...this.logs];
  }
}
