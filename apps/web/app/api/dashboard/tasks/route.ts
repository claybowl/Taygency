import { NextRequest, NextResponse } from "next/server";
import type { TasksResponse } from "@vibe-planning/shared";
import { WorkspaceManager } from "@/lib/workspace";
import { TaskManager } from "@/lib/tasks";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") as
      | "active"
      | "completed"
      | "someday"
      | null;

    const workspace = WorkspaceManager.getInstance();
    const tasks = new TaskManager(workspace);

    const taskList = await tasks.listTasks(status ?? undefined);

    const categories = taskList.reduce(
      (acc, task) => {
        const cat = task.category;
        const existing = acc.find((c) => c.name === cat);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ name: cat, count: 1 });
        }
        return acc;
      },
      [] as { name: string; count: number }[],
    );

    const response: TasksResponse = {
      tasks: taskList,
      categories,
      stats: {
        total: taskList.length,
        active: taskList.filter((t) => t.status === "active").length,
        completed: taskList.filter((t) => t.status === "completed").length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Dashboard Tasks] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
