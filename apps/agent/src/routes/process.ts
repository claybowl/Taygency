import { Router } from 'express';
import type { Request, Response } from 'express';
import type { AgentRequest, AgentResponse, TasksResponse, TaskStatus } from '@vibe-planning/shared';
import { AgentCore } from '../agent/core.js';
import { WorkspaceManager } from '../filesystem/workspace.js';
import { TaskManager } from '../filesystem/tasks.js';

const router = Router();

router.post('/process', async (req: Request, res: Response) => {
  try {
    const request: AgentRequest = req.body;

    if (!request.userId || !request.message || !request.channel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const agent = new AgentCore(request.userId);
    const response = await agent.process(request);

    return res.json(response);
  } catch (error) {
    console.error('[Process] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const status = req.query.status as TaskStatus | undefined;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const workspace = new WorkspaceManager(userId);
    const tasks = new TaskManager(workspace);

    const taskList = await tasks.listTasks(status);

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
      [] as { name: string; count: number }[]
    );

    const response: TasksResponse = {
      tasks: taskList,
      categories,
      stats: {
        total: taskList.length,
        active: taskList.filter((t) => t.status === 'active').length,
        completed: taskList.filter((t) => t.status === 'completed').length,
      },
    };

    return res.json(response);
  } catch (error) {
    console.error('[Tasks] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
