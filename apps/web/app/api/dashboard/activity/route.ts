import { NextResponse } from "next/server";
import { WorkspaceManager } from "@/lib/workspace";
import { TaskManager } from "@/lib/tasks";

export interface ActivityItem {
  id: string;
  type: "email" | "sms" | "task" | "system" | "skill";
  channel: string;
  preview: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityResponse {
  activities: ActivityItem[];
  lastActivityAt: string | null;
}

export async function GET() {
  try {
    const workspace = WorkspaceManager.getInstance();
    const taskManager = new TaskManager(workspace);

    const activities: ActivityItem[] = [];
    const now = new Date();

    const allTasks = await taskManager.listTasks();

    const recentTasks = allTasks
      .filter((task) => {
        const updatedAt = new Date(task.updatedAt);
        const hoursSince =
          (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
        return hoursSince < 24;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 10);

    for (const task of recentTasks) {
      const isCompleted = task.status === "completed";
      const channel = isCompleted
        ? "task_completed"
        : task.source === "email"
          ? "incoming_email"
          : task.source === "sms"
            ? "incoming_sms"
            : "task_created";

      activities.push({
        id: `activity-${task.id}`,
        type:
          task.source === "email"
            ? "email"
            : task.source === "sms"
              ? "sms"
              : "task",
        channel,
        preview: isCompleted
          ? `Completed: "${task.title.slice(0, 60)}${task.title.length > 60 ? "..." : ""}"`
          : `${task.title.slice(0, 60)}${task.title.length > 60 ? "..." : ""}`,
        timestamp: task.updatedAt,
        metadata: {
          taskId: task.id,
          priority: task.priority,
          category: task.category,
          status: task.status,
        },
      });
    }

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const lastActivityAt =
      activities.length > 0 ? activities[0].timestamp : null;

    return NextResponse.json({
      activities: activities.slice(0, 10),
      lastActivityAt,
    } as ActivityResponse);
  } catch (error) {
    console.error("[Activity API] Error:", error);

    return NextResponse.json({
      activities: [],
      lastActivityAt: null,
    } as ActivityResponse);
  }
}
