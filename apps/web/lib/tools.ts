import type Anthropic from "@anthropic-ai/sdk";
import type { AgentAction, Task, TaskInput } from "@vibe-planning/shared";
import { WorkspaceManager } from "./workspace";
import { TaskManager } from "./tasks";
import { SkillExecutor } from "./skills";

export interface ToolResult {
  result: unknown;
  action: AgentAction;
}

export class ToolExecutor {
  private workspace: WorkspaceManager;
  private tasks: TaskManager;
  private skills: SkillExecutor;

  constructor(workspace: WorkspaceManager) {
    this.workspace = workspace;
    this.tasks = new TaskManager(workspace);
    this.skills = new SkillExecutor(workspace);
  }

  getToolDefinitions(): Anthropic.Tool[] {
    return [
      {
        name: "create_task",
        description: "Create a new task in the workspace",
        input_schema: {
          type: "object" as const,
          properties: {
            title: { type: "string", description: "Task title" },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Task priority",
            },
            category: { type: "string", description: "Task category" },
            due: { type: "string", description: "Due date (ISO 8601)" },
            notes: { type: "string", description: "Additional notes" },
            energy: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Energy level required",
            },
            duration: {
              type: "string",
              description: "Estimated duration (e.g., 30m, 2h)",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "list_tasks",
        description: "List tasks, optionally filtered by status or category",
        input_schema: {
          type: "object" as const,
          properties: {
            status: {
              type: "string",
              enum: ["active", "completed", "someday"],
            },
            category: { type: "string" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "complete_task",
        description: "Mark a task as completed",
        input_schema: {
          type: "object" as const,
          properties: {
            taskId: { type: "string", description: "Task ID to complete" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task",
        input_schema: {
          type: "object" as const,
          properties: {
            taskId: { type: "string", description: "Task ID to update" },
            title: { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
            category: { type: "string" },
            status: {
              type: "string",
              enum: ["active", "completed", "someday"],
            },
            due: { type: "string" },
            notes: { type: "string" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "read_file",
        description: "Read a file from the user workspace",
        input_schema: {
          type: "object" as const,
          properties: {
            path: {
              type: "string",
              description: "Relative path in workspace",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write content to a file in the user workspace",
        input_schema: {
          type: "object" as const,
          properties: {
            path: {
              type: "string",
              description: "Relative path in workspace",
            },
            content: { type: "string", description: "File content" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "search_files",
        description: "Search for content across all files in workspace",
        input_schema: {
          type: "object" as const,
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
      {
        name: "execute_skill",
        description: "Execute a skill from the skills folder",
        input_schema: {
          type: "object" as const,
          properties: {
            skillName: {
              type: "string",
              description:
                "Name of skill to execute (categorize, prioritize, daily-planning)",
            },
            params: {
              type: "object",
              description: "Parameters for the skill",
            },
          },
          required: ["skillName"],
        },
      },
    ];
  }

  async execute(
    name: string,
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    switch (name) {
      case "create_task":
        return this.createTask(input as unknown as TaskInput);
      case "list_tasks":
        return this.listTasks(input);
      case "complete_task":
        return this.completeTask(input.taskId as string);
      case "update_task":
        return this.updateTask(input.taskId as string, input);
      case "read_file":
        return this.readFile(input.path as string);
      case "write_file":
        return this.writeFile(input.path as string, input.content as string);
      case "search_files":
        return this.searchFiles(input.query as string);
      case "execute_skill":
        return this.executeSkill(
          input.skillName as string,
          input.params as Record<string, unknown>,
        );
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async createTask(input: TaskInput): Promise<ToolResult> {
    const task = await this.tasks.createTask(input);
    return {
      result: { taskId: task.id, title: task.title },
      action: { type: "task_created", taskId: task.id, title: task.title },
    };
  }

  private async listTasks(input: Record<string, unknown>): Promise<ToolResult> {
    const status = input.status as Task["status"] | undefined;
    const category = input.category as string | undefined;
    const limit = (input.limit as number) ?? 20;

    const tasks = await this.tasks.listTasks(status, category);
    const limited = tasks.slice(0, limit);

    return {
      result: {
        tasks: limited.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          category: t.category,
          due: t.due,
        })),
        total: tasks.length,
      },
      action: { type: "file_written", path: "tasks/" },
    };
  }

  private async completeTask(taskId: string): Promise<ToolResult> {
    const task = await this.tasks.completeTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    return {
      result: { taskId, completed: true },
      action: { type: "task_completed", taskId },
    };
  }

  private async updateTask(
    taskId: string,
    updates: Record<string, unknown>,
  ): Promise<ToolResult> {
    const { taskId: _, ...rest } = updates;
    const task = await this.tasks.updateTask(taskId, rest as Partial<Task>);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    return {
      result: { taskId, updated: true },
      action: { type: "task_updated", taskId, changes: rest },
    };
  }

  private async readFile(filePath: string): Promise<ToolResult> {
    const content = await this.workspace.readFile(filePath);
    return {
      result: { path: filePath, content },
      action: { type: "file_written", path: filePath },
    };
  }

  private async writeFile(
    filePath: string,
    content: string,
  ): Promise<ToolResult> {
    await this.workspace.writeFile(filePath, content);
    return {
      result: { path: filePath, written: true },
      action: { type: "file_written", path: filePath },
    };
  }

  private async searchFiles(query: string): Promise<ToolResult> {
    const results = await this.workspace.searchFiles(query);
    return {
      result: { query, matches: results },
      action: { type: "file_written", path: "search" },
    };
  }

  private async executeSkill(
    skillName: string,
    params: Record<string, unknown> = {},
  ): Promise<ToolResult> {
    const result = await this.skills.execute(skillName, params);
    return {
      result,
      action: {
        type: "skill_executed",
        skill: skillName,
        result: result.output,
      },
    };
  }
}
