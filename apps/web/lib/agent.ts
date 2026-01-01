import type { AgentRequest, AgentResponse } from '@vibe-planning/shared';

const FLY_AGENT_URL = process.env.FLY_AGENT_URL!;
const AGENT_SECRET = process.env.AGENT_SECRET!;

export async function processWithAgent(request: AgentRequest): Promise<AgentResponse> {
  const response = await fetch(`${FLY_AGENT_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AGENT_SECRET}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Agent request failed: ${response.status} ${error}`);
  }

  return response.json();
}

export async function checkAgentHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${FLY_AGENT_URL}/health`, {
      headers: { Authorization: `Bearer ${AGENT_SECRET}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
