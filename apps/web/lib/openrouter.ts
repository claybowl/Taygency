import OpenAI from "openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// OpenRouter uses OpenAI-compatible API
export const openrouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
});

export function getOpenRouterModel(): string {
  // OpenRouter model identifiers
  // Use "openrouter/opus-4.5" or "anthropic/claude-sonnet-4-20250514" routed through OpenRouter
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-20250514";
}

export function requireOpenRouterKey(): void {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }
}
