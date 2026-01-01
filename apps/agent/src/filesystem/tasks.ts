import matter from 'gray-matter';
import type { Task, TaskInput, TaskStatus, TaskPriority } from '@vibe-planning/shared';
import { DEFAULT_PRIORITY, DEFAULT_CATEGORY, DEFAULT_STATUS } from '@vibe-planning/shared';
import { WorkspaceManager } from './workspace.js';

export class TaskManager {
  private workspace: WorkspaceManager;

  constructor(workspace: WorkspaceManager) {
    this.workspace = workspace;
  }

  async createTask(input: TaskInput, source?: string): Promise<Task> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const task: Task = {
      id: taskId,
      title: input.title,
      status: DEFAULT_STATUS,
      priority: input.priority ?? DEFAULT_PRIORITY,
      category: input.category ?? DEFAULT_CATEGORY,
      energy: input.energy,
      duration: input.duration,
      context: input.context,
      due: input.due,
      project: input.project,
      source: source as Task['source'],
      notes: input.notes,
      subtasks: input.subtasks?.map((title) => ({ title, completed: false })),
      createdAt: now,
      updatedAt: now,
    };

    const content = this.taskToMarkdown(task);
    await this.workspace.writeFile(`tasks/active/${taskId}.md`, content);

    return task;
  }

  async getTask(taskId: string): Promise<Task | null> {
    for (const status of ['active', 'completed', 'someday'] as const) {
      try {
        const content = await this.workspace.readFile(`tasks/${status}/${taskId}.md`);
        return this.parseTaskFile(content, taskId);
      } catch {
        continue;
      }
    }
    return null;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    const updated: Task = {
      ...task,
      ...updates,
      id: taskId,
      updatedAt: new Date().toISOString(),
    };

    const oldPath = `tasks/${task.status}/${taskId}.md`;
    const newPath = `tasks/${updated.status}/${taskId}.md`;

    const content = this.taskToMarkdown(updated);

    if (task.status !== updated.status) {
      await this.workspace.deleteFile(oldPath);
      await this.workspace.writeFile(newPath, content);
    } else {
      await this.workspace.writeFile(oldPath, content);
    }

    return updated;
  }

  async completeTask(taskId: string): Promise<Task | null> {
    return this.updateTask(taskId, { status: 'completed' });
  }

  async listTasks(status?: TaskStatus, category?: string): Promise<Task[]> {
    const statuses: TaskStatus[] = status ? [status] : ['active', 'completed', 'someday'];
    const tasks: Task[] = [];

    for (const s of statuses) {
      const files = await this.workspace.listDirectory(`tasks/${s}`);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        try {
          const content = await this.workspace.readFile(`tasks/${s}/${file}`);
          const taskId = file.replace('.md', '');
          const task = this.parseTaskFile(content, taskId);

          if (task && (!category || task.category === category)) {
            tasks.push(task);
          }
        } catch {
          continue;
        }
      }
    }

    return tasks.sort((a, b) => {
      const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private taskToMarkdown(task: Task): string {
    const frontmatter: Record<string, unknown> = {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      category: task.category,
    };

    if (task.energy) frontmatter.energy = task.energy;
    if (task.duration) frontmatter.duration = task.duration;
    if (task.context?.length) frontmatter.context = task.context;
    if (task.due) frontmatter.due = task.due;
    if (task.project) frontmatter.project = task.project;
    if (task.source) frontmatter.source = task.source;

    frontmatter.created = task.createdAt;
    frontmatter.updated = task.updatedAt;

    let body = `# ${task.title}\n`;

    if (task.notes) {
      body += `\n## Notes\n${task.notes}\n`;
    }

    if (task.subtasks?.length) {
      body += `\n## Subtasks\n`;
      for (const sub of task.subtasks) {
        body += `- [${sub.completed ? 'x' : ' '}] ${sub.title}\n`;
      }
    }

    return matter.stringify(body, frontmatter);
  }

  private parseTaskFile(content: string, taskId: string): Task | null {
    try {
      const { data, content: body } = matter(content);

      const subtasks = this.parseSubtasks(body);
      const notes = this.parseNotes(body);

      return {
        id: taskId,
        title: data.title as string,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        category: data.category as string,
        energy: data.energy,
        duration: data.duration,
        context: data.context,
        due: data.due,
        project: data.project,
        source: data.source,
        notes,
        subtasks,
        createdAt: data.created as string,
        updatedAt: data.updated as string,
      };
    } catch {
      return null;
    }
  }

  private parseSubtasks(body: string): Task['subtasks'] {
    const subtaskRegex = /- \[([ x])\] (.+)/g;
    const subtasks: Task['subtasks'] = [];
    let match;

    while ((match = subtaskRegex.exec(body)) !== null) {
      subtasks.push({
        completed: match[1] === 'x',
        title: match[2],
      });
    }

    return subtasks.length > 0 ? subtasks : undefined;
  }

  private parseNotes(body: string): string | undefined {
    const notesMatch = body.match(/## Notes\n([\s\S]*?)(?=\n## |\n*$)/);
    return notesMatch?.[1]?.trim() || undefined;
  }
}
