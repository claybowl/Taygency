import type {
  AgentRequest,
  AgentResponse,
  AgentExecutionTrace,
} from "@vibe-planning/shared";
import { AgentCore } from "./agent-core";

export interface AgentResult {
  response: AgentResponse;
  trace: AgentExecutionTrace;
}

export async function processWithAgent(
  request: AgentRequest,
): Promise<AgentResult> {
  const agent = AgentCore.getInstance();
  return agent.process(request);
}

export async function checkAgentHealth(): Promise<boolean> {
  return true;
}
