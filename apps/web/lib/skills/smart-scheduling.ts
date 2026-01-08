import type { Tool, Skill } from "@vibe-planning/shared";

interface SkillContext {
  userId: string;
}

interface TaskDetails {
  id: string;
  title: string;
  energyLevel: string;
  priority: string;
  estimatedMinutes?: number;
  deadline?: string;
}

interface FreeWindow {
  start: string;
  end: string;
  duration_minutes: number;
}

export class SmartSchedulingSkill implements Skill {
  name = "smart_scheduling";
  version = "1.0.0";
  trigger =
    "scheduling tasks, finding optimal times, creating daily schedules, finding focus blocks";
  description =
    "Suggest optimal times to complete tasks based on energy, availability, and patterns";
  content = "";

  static ENERGY_TIME_PREFERENCES: Record<
    string,
    {
      preferred_hours: number[];
      acceptable_hours: number[];
      avoid_hours: number[];
    }
  > = {
    high: {
      preferred_hours: [9, 10, 11],
      acceptable_hours: [14, 15],
      avoid_hours: [12, 13, 16, 17],
    },
    medium: {
      preferred_hours: [10, 11, 14, 15],
      acceptable_hours: [9, 16],
      avoid_hours: [12, 13],
    },
    low: {
      preferred_hours: [13, 16, 17],
      acceptable_hours: [],
      avoid_hours: [],
    },
  };

  tools: Tool[] = [
    {
      name: "suggest_time_for_task",
      description: "Suggest the best time slot to work on a specific task",
      input_schema: {
        type: "object",
        properties: {
          task_id: {
            type: "string",
            description: "ID of the task to schedule",
          },
          preferred_date: {
            type: "string",
            description: "Preferred date (YYYY-MM-DD), defaults to today",
          },
        },
        required: ["task_id"],
      },
    },
    {
      name: "suggest_daily_schedule",
      description: "Create an optimal schedule for today's tasks",
      input_schema: {
        type: "object",
        properties: {
          task_ids: {
            type: "array",
            items: { type: "string" },
            description: "List of task IDs to schedule",
          },
          date: {
            type: "string",
            description: "Date to schedule (YYYY-MM-DD)",
          },
        },
        required: ["task_ids", "date"],
      },
    },
    {
      name: "find_focus_blocks",
      description: "Find the best times for deep focus work this week",
      input_schema: {
        type: "object",
        properties: {
          duration_minutes: {
            type: "integer",
            description: "Required focus block duration",
            default: 90,
          },
          count: {
            type: "integer",
            description: "Number of blocks to find",
            default: 3,
          },
        },
        required: [],
      },
    },
  ];

  async execute(
    toolName: string,
    toolInput: Record<string, unknown>,
    context: SkillContext,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    switch (toolName) {
      case "suggest_time_for_task":
        return this.suggestTimeForTask(
          context,
          toolInput.task_id as string,
          toolInput.preferred_date as string | undefined,
        );
      case "suggest_daily_schedule":
        return this.suggestDailySchedule(
          context,
          toolInput.task_ids as string[],
          toolInput.date as string,
        );
      case "find_focus_blocks":
        return this.findFocusBlocks(
          context,
          (toolInput.duration_minutes as number) ?? 90,
          (toolInput.count as number) ?? 3,
        );
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  private async suggestTimeForTask(
    context: SkillContext,
    taskId: string,
    preferredDate: string | undefined,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    // Mock task lookup - in production, this would call context.db.getTask()
    const task = await this.getTaskById(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Mock calendar sync call - in production, use context.skills.calendarSync
    const date = preferredDate || new Date().toISOString().split("T")[0];
    const freeWindows = await this.getFreeWindows(
      date,
      task.estimatedMinutes || 30,
    );

    if (!freeWindows.length) {
      return {
        success: true,
        data: {
          suggestion: null,
          reason: `No free windows of ${task.estimatedMinutes || 30}+ minutes on ${date}`,
          alternative: "Try tomorrow or extend your search",
        },
      };
    }

    const energyPrefs =
      SmartSchedulingSkill.ENERGY_TIME_PREFERENCES[task.energyLevel] ||
      SmartSchedulingSkill.ENERGY_TIME_PREFERENCES.medium;

    const scoredWindows = freeWindows.map((window) => {
      const windowStart = new Date(window.start);
      const hour = windowStart.getHours();
      let score: number;
      if (energyPrefs.preferred_hours.includes(hour)) {
        score = 100;
      } else if (energyPrefs.acceptable_hours.includes(hour)) {
        score = 70;
      } else if (energyPrefs.avoid_hours.includes(hour)) {
        score = 30;
      } else {
        score = 50;
      }
      return { ...window, score, hour };
    });

    scoredWindows.sort((a, b) => b.score - a.score);
    const bestWindow = scoredWindows[0];

    return {
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          estimated_minutes: task.estimatedMinutes,
        },
        suggestion: {
          start: bestWindow.start,
          end: bestWindow.end,
          reason: this.getSuggestionReason(task.energyLevel, bestWindow.hour),
        },
        alternatives: scoredWindows.slice(1, 3),
      },
    };
  }

  private async suggestDailySchedule(
    context: SkillContext,
    taskIds: string[],
    date: string,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const tasks: TaskDetails[] = [];
    for (const taskId of taskIds) {
      const task = await this.getTaskById(taskId);
      if (task) tasks.push(task);
    }

    const energyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const priorityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    tasks.sort((a, b) => {
      const energyDiff =
        (energyOrder[a.energyLevel] ?? 1) - (energyOrder[b.energyLevel] ?? 1);
      if (energyDiff !== 0) return energyDiff;
      return (
        (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
      );
    });

    const freeWindows = await this.getFreeWindows(date, 15);
    const schedule: Array<{
      task_id: string;
      task_title: string;
      start: string;
      end: string;
      energy_level: string;
    }> = [];
    const remainingWindows = [...freeWindows];

    for (const task of tasks) {
      const taskDuration = task.estimatedMinutes || 30;
      const bestWindowIdx = this.findBestWindowForEnergy(
        remainingWindows,
        task.energyLevel,
        taskDuration,
      );

      if (bestWindowIdx !== null) {
        const window = remainingWindows[bestWindowIdx];
        const taskStart = new Date(window.start);
        const taskEnd = new Date(
          taskStart.getTime() + taskDuration * 60 * 1000,
        );

        schedule.push({
          task_id: task.id,
          task_title: task.title,
          start: taskStart.toISOString(),
          end: taskEnd.toISOString(),
          energy_level: task.energyLevel,
        });

        if (window.duration_minutes > taskDuration) {
          remainingWindows[bestWindowIdx] = {
            start: taskEnd.toISOString(),
            end: window.end,
            duration_minutes: window.duration_minutes - taskDuration,
          };
        } else {
          remainingWindows.splice(bestWindowIdx, 1);
        }
      }
    }

    const scheduledIds = new Set(schedule.map((s) => s.task_id));

    return {
      success: true,
      data: {
        date,
        scheduled_tasks: schedule,
        unscheduled_tasks: tasks
          .filter((t) => !scheduledIds.has(t.id))
          .map((t) => t.id),
      },
    };
  }

  private async findFocusBlocks(
    context: SkillContext,
    durationMinutes: number,
    count: number,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const focusBlocks: Array<{
      date: string;
      day_name: string;
      start: string;
      end: string;
      duration_minutes: number;
      recommendation: string;
    }> = [];
    const today = new Date();

    for (let i = 0; i < 7 && focusBlocks.length < count; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const freeWindows = await this.getFreeWindows(dateStr, durationMinutes);
      const morningBlocks = freeWindows.filter((w) => {
        const hour = new Date(w.start).getHours();
        return hour >= 9 && hour <= 11;
      });

      for (const block of morningBlocks) {
        if (focusBlocks.length >= count) break;

        focusBlocks.push({
          date: dateStr,
          day_name: checkDate.toLocaleDateString("en-US", { weekday: "long" }),
          start: block.start,
          end: block.end,
          duration_minutes: block.duration_minutes,
          recommendation: "Morning focus block—ideal for deep work",
        });
      }
    }

    return {
      success: true,
      data: {
        focus_blocks: focusBlocks,
        count: focusBlocks.length,
        tip: "Block these times on your calendar to protect them",
      },
    };
  }

  private getSuggestionReason(energyLevel: string, hour: number): string {
    if (energyLevel === "high") {
      if ([9, 10, 11].includes(hour)) {
        return "Morning is ideal for high-focus work when your energy is peak";
      } else if ([14, 15].includes(hour)) {
        return "Early afternoon is your second-best window for focus work";
      }
    } else if (energyLevel === "low") {
      if ([13, 16, 17].includes(hour)) {
        return "This slot works great for lighter tasks during natural energy dips";
      }
    }
    return "This window matches your availability and task requirements";
  }

  private findBestWindowForEnergy(
    windows: FreeWindow[],
    energyLevel: string,
    minDuration: number,
  ): number | null {
    const energyPrefs =
      SmartSchedulingSkill.ENERGY_TIME_PREFERENCES[energyLevel] ||
      SmartSchedulingSkill.ENERGY_TIME_PREFERENCES.medium;

    let bestIdx: number | null = null;
    let bestScore = -1;

    windows.forEach((window, idx) => {
      if (window.duration_minutes < minDuration) return;
      const hour = new Date(window.start).getHours();
      let score: number;
      if (energyPrefs.preferred_hours.includes(hour)) {
        score = 100;
      } else if (energyPrefs.acceptable_hours.includes(hour)) {
        score = 70;
      } else {
        score = 50;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    return bestIdx;
  }

  private async getTaskById(taskId: string): Promise<TaskDetails | null> {
    // Mock implementation - replace with actual database call
    return {
      id: taskId,
      title: "Sample Task",
      energyLevel: "medium",
      priority: "medium",
      estimatedMinutes: 30,
    };
  }

  private async getFreeWindows(
    date: string,
    minDuration: number,
  ): Promise<FreeWindow[]> {
    // Mock implementation - replace with calendar sync skill call
    const today = new Date(date);
    return [
      {
        start: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
        end: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
        duration_minutes: 90,
      },
      {
        start: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        end: new Date(today.setHours(15, 0, 0, 0)).toISOString(),
        duration_minutes: 60,
      },
    ];
  }
}
