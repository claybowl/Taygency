import { NextResponse } from "next/server";
import type {
  VAPIMessage,
  VAPIToolCall,
  VAPIToolResult,
  VAPIWebhookResponse,
  TaskStatus,
  TaskPriority,
} from "@vibe-planning/shared";
import { WorkspaceManager } from "./workspace";
import { TaskManager } from "./tasks";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_PHONE_NUMBER = process.env.VAPI_PHONE_NUMBER;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;

interface SendSMSParams {
  to: string;
  message: string;
}

interface StartCallParams {
  to: string;
  message?: string;
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<void> {
  if (!VAPI_API_KEY) {
    console.warn("[VAPI] No API key configured, skipping SMS send");
    return;
  }

  const response = await fetch(`${VAPI_BASE_URL}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VAPI_API_KEY}`,
    },
    body: JSON.stringify({
      to,
      message,
      phoneNumberId: VAPI_PHONE_NUMBER,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`VAPI SMS failed: ${response.status} ${error}`);
  }
}

export async function startCall({
  to,
  message,
}: StartCallParams): Promise<{ callId: string }> {
  if (!VAPI_API_KEY) {
    throw new Error("VAPI_API_KEY is not configured");
  }
  if (!VAPI_PHONE_NUMBER) {
    throw new Error("VAPI_PHONE_NUMBER is not configured");
  }
  // Validate that VAPI_PHONE_NUMBER is a UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(VAPI_PHONE_NUMBER)) {
    throw new Error(
      `VAPI_PHONE_NUMBER must be a UUID (Phone Number ID). Current value looks like a phone number: "${VAPI_PHONE_NUMBER.substring(0, 4)}..."`,
    );
  }

  if (!VAPI_ASSISTANT_ID) {
    throw new Error("VAPI_ASSISTANT_ID is not configured");
  }

  const payload: any = {
    phoneNumberId: VAPI_PHONE_NUMBER,
    assistantId: VAPI_ASSISTANT_ID,
    customer: {
      number: to,
    },
  };

  if (message) {
    payload.assistantOverrides = {
      firstMessage: message,
    };
  }

  const response = await fetch(`${VAPI_BASE_URL}/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VAPI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`VAPI Call failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return { callId: data.id };
}

export function extractPhoneNumber(message: VAPIMessage): string | null {
  return message.call?.customer?.number ?? null;
}

export function extractCallId(message: VAPIMessage): string | null {
  return message.call?.id ?? null;
}

async function getTaskManager(): Promise<TaskManager> {
  const workspace = WorkspaceManager.getInstance();
  await workspace.initialize();
  return new TaskManager(workspace);
}

interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export async function createTaskFromVAPI(
  title: string,
  priority?: string,
  category?: string,
  due?: string,
): Promise<ToolExecutionResult> {
  try {
    const taskManager = await getTaskManager();
    const task = await taskManager.createTask(
      {
        title,
        priority: (priority as TaskPriority) ?? "medium",
        category: category ?? "inbox",
        due,
      },
      "voice",
    );

    return {
      success: true,
      message: `Created task: "${task.title}" with ${task.priority} priority`,
      data: { taskId: task.id, title: task.title },
    };
  } catch (error) {
    console.error("[VAPI] Create task failed:", error);
    return {
      success: false,
      message: "Sorry, I couldn't create that task. Please try again.",
    };
  }
}

export async function listTasksFromVAPI(
  status?: string,
  limit = 5,
): Promise<ToolExecutionResult> {
  try {
    const taskManager = await getTaskManager();
    const tasks = await taskManager.listTasks(status as TaskStatus);
    const limited = tasks.slice(0, limit);

    if (limited.length === 0) {
      return {
        success: true,
        message:
          status === "completed"
            ? "You don't have any completed tasks yet."
            : "You don't have any active tasks. Nice work!",
        data: { tasks: [], count: 0 },
      };
    }

    const taskList = limited
      .map((t, i) => `${i + 1}. ${t.title}${t.due ? ` (due ${t.due})` : ""}`)
      .join(". ");

    const countInfo =
      tasks.length > limit ? ` Showing ${limit} of ${tasks.length} total.` : "";

    return {
      success: true,
      message: `You have ${tasks.length} ${status ?? "active"} tasks.${countInfo} ${taskList}`,
      data: {
        tasks: limited.map((t) => ({ id: t.id, title: t.title, due: t.due })),
        count: tasks.length,
      },
    };
  } catch (error) {
    console.error("[VAPI] List tasks failed:", error);
    return {
      success: false,
      message: "Sorry, I couldn't retrieve your tasks. Please try again.",
    };
  }
}

export async function completeTaskFromVAPI(
  taskIdOrTitle: string,
): Promise<ToolExecutionResult> {
  try {
    const taskManager = await getTaskManager();

    if (taskIdOrTitle.startsWith("task-")) {
      const task = await taskManager.completeTask(taskIdOrTitle);
      if (task) {
        return {
          success: true,
          message: `Done! Marked "${task.title}" as complete.`,
          data: { taskId: task.id },
        };
      }
    }

    const tasks = await taskManager.listTasks("active");
    const matchingTask = tasks.find(
      (t) =>
        t.title.toLowerCase().includes(taskIdOrTitle.toLowerCase()) ||
        t.id === taskIdOrTitle,
    );

    if (matchingTask) {
      const completed = await taskManager.completeTask(matchingTask.id);
      if (completed) {
        return {
          success: true,
          message: `Done! Marked "${completed.title}" as complete.`,
          data: { taskId: completed.id },
        };
      }
    }

    return {
      success: false,
      message: `I couldn't find a task matching "${taskIdOrTitle}". Could you be more specific?`,
    };
  } catch (error) {
    console.error("[VAPI] Complete task failed:", error);
    return {
      success: false,
      message: "Sorry, I couldn't complete that task. Please try again.",
    };
  }
}

export async function getTaskSummaryFromVAPI(): Promise<ToolExecutionResult> {
  try {
    const taskManager = await getTaskManager();
    const active = await taskManager.listTasks("active");
    const completed = await taskManager.listTasks("completed");

    const highPriority = active.filter((t) => t.priority === "high");
    const dueSoon = active.filter((t) => {
      if (!t.due) return false;
      const dueDate = new Date(t.due);
      const now = new Date();
      const daysDiff =
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 2 && daysDiff >= 0;
    });

    let message = `You have ${active.length} active tasks and ${completed.length} completed.`;

    if (highPriority.length > 0) {
      message += ` ${highPriority.length} are high priority.`;
    }

    if (dueSoon.length > 0) {
      message += ` ${dueSoon.length} are due in the next 2 days.`;
    }

    if (active.length > 0) {
      message += ` Your top task is: ${active[0].title}.`;
    }

    return {
      success: true,
      message,
      data: {
        active: active.length,
        completed: completed.length,
        highPriority: highPriority.length,
        dueSoon: dueSoon.length,
      },
    };
  } catch (error) {
    console.error("[VAPI] Get summary failed:", error);
    return {
      success: false,
      message: "Sorry, I couldn't get your task summary. Please try again.",
    };
  }
}

export async function executeVAPITool(
  toolCall: VAPIToolCall,
): Promise<VAPIToolResult> {
  const { id, name, parameters } = toolCall;
  let result: ToolExecutionResult;

  switch (name) {
    case "createTask":
      result = await createTaskFromVAPI(
        parameters.title as string,
        parameters.priority as string | undefined,
        parameters.category as string | undefined,
        parameters.due as string | undefined,
      );
      break;

    case "listTasks":
      result = await listTasksFromVAPI(
        parameters.status as string | undefined,
        parameters.limit as number | undefined,
      );
      break;

    case "completeTask":
      result = await completeTaskFromVAPI(
        (parameters.taskId as string) || (parameters.title as string),
      );
      break;

    case "getTaskSummary":
      result = await getTaskSummaryFromVAPI();
      break;

    default:
      result = {
        success: false,
        message: `I don't know how to do that yet. Unknown action: ${name}`,
      };
  }

  return {
    toolCallId: id,
    name,
    result: JSON.stringify(result),
  };
}

export function buildToolResponse(
  results: VAPIToolResult[],
  message?: string,
): VAPIWebhookResponse {
  return {
    results,
    ...(message && { message }),
  };
}

export function buildSuccessResponse(): VAPIWebhookResponse {
  return { success: true };
}

export function buildAssistantResponse(
  assistantId: string,
): VAPIWebhookResponse {
  return { assistantId };
}

export function jsonResponse(data: VAPIWebhookResponse): NextResponse {
  return NextResponse.json(data);
}
