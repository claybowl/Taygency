import type { AgentRequest, AgentResponse } from "@vibe-planning/shared";
import { AgentCore } from "./agent-core";

export async function processWithAgent(
  request: AgentRequest,
): Promise<AgentResponse> {
  const agent = AgentCore.getInstance();
  return agent.process(request);
}

export async function checkAgentHealth(): Promise<boolean> {
  return true;
}
