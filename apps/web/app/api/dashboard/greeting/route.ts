import { NextResponse } from "next/server";
import OpenAI from "openai";
import { WorkspaceManager } from "@/lib/workspace";
import { TaskManager } from "@/lib/tasks";

export interface GreetingResponse {
  message: string;
  generated: boolean;
  timestamp: string;
}

const FALLBACK_GREETINGS = [
  "Every line of code is a step toward something remarkable. Let's build today! 🚀",
  "The best agents are built one task at a time. You're doing great! ✨",
  "Welcome back! Your productivity awaits. Let's make it a good one. 💪",
  "Systems thinking + action = unstoppable. Ready when you are! 🎯",
  "Another day, another opportunity to automate the mundane and focus on what matters. 🌟",
  "Your future self will thank you for what you accomplish today. Let's go! 🔥",
  "Coffee's brewing, code's compiling, tasks are waiting. Time to shine! ☕",
  "Remember: done is better than perfect. Let's ship something awesome! 📦",
  "The dashboard is ready. The tasks are queued. The only missing piece is you! 🧩",
  "Small progress is still progress. Every task completed is a victory! 🏆",
];

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Burning the midnight oil";
}

function getFallbackGreeting(): string {
  const randomIndex = Math.floor(Math.random() * FALLBACK_GREETINGS.length);
  return FALLBACK_GREETINGS[randomIndex];
}

export async function GET() {
  const timestamp = new Date().toISOString();

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({
      message: getFallbackGreeting(),
      generated: false,
      timestamp,
    } as GreetingResponse);
  }

  try {
    const workspace = WorkspaceManager.getInstance();
    const taskManager = new TaskManager(workspace);

    let taskContext = "";
    try {
      const tasks = await taskManager.listTasks("active");
      const highPriority = tasks.filter((t) => t.priority === "high").length;
      const total = tasks.length;
      const categories = [...new Set(tasks.map((t) => t.category))].slice(0, 3);

      if (total > 0) {
        taskContext = `The user has ${total} active tasks${highPriority > 0 ? ` (${highPriority} high priority)` : ""}. Categories: ${categories.join(", ") || "various"}.`;
      }
    } catch {
      taskContext = "";
    }

    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const timeGreeting = getTimeOfDayGreeting();
    const dayOfWeek = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const response = await client.chat.completions.create({
      model: "anthropic/claude-3-5-haiku-20241022",
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `You are a friendly, witty AI assistant greeting a user on their productivity dashboard. Generate a short, motivating message (1-2 sentences max). Be encouraging, occasionally humorous, and always positive. Don't be cheesy or overly corporate. Think: supportive friend who happens to be really good at getting things done.

Style examples:
- "Mondays are just Fridays in disguise. Let's prove it! 🚀"
- "Your task list called. It misses you. Let's give it some attention! 📋"
- "Time to turn caffeine into accomplishments. You've got this! ☕"

Keep it brief, punchy, and genuine. One emoji max.`,
        },
        {
          role: "user",
          content: `Generate a greeting for: ${timeGreeting} on ${dayOfWeek}. ${taskContext}`,
        },
      ],
    });

    const generatedMessage = response.choices[0]?.message?.content?.trim();

    if (generatedMessage) {
      return NextResponse.json({
        message: generatedMessage,
        generated: true,
        timestamp,
      } as GreetingResponse);
    }

    return NextResponse.json({
      message: getFallbackGreeting(),
      generated: false,
      timestamp,
    } as GreetingResponse);
  } catch (error) {
    console.error("[Greeting API] Error:", error);

    return NextResponse.json({
      message: getFallbackGreeting(),
      generated: false,
      timestamp,
    } as GreetingResponse);
  }
}
