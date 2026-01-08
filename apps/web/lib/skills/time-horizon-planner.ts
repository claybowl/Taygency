import type { Tool, Skill } from "@vibe-planning/shared";

interface SkillContext {
  userId: string;
}

interface TaskDetails {
  id: string;
  title: string;
  priority: string;
  energyLevel: string;
  estimatedMinutes?: number;
  dueDate?: Date;
  status: string;
}

export class TimeHorizonPlannerSkill implements Skill {
  name = "time_horizon_planner";
  version = "1.0.0";
  trigger =
    "looking ahead, deadline clusters, workload balance, light days, redistribution";
  description =
    "Look ahead to identify deadline clusters, light days, and workload imbalances";
  content = "";

  tools: Tool[] = [
    {
      name: "get_week_overview",
      description:
        "Get a bird's eye view of the upcoming week's tasks and deadlines",
      input_schema: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            description: "Start date (YYYY-MM-DD), defaults to today",
          },
        },
        required: [],
      },
    },
    {
      name: "find_deadline_clusters",
      description: "Identify days with multiple deadlines",
      input_schema: {
        type: "object",
        properties: {
          days_ahead: {
            type: "integer",
            description: "Number of days to look ahead",
            default: 14,
          },
          cluster_threshold: {
            type: "integer",
            description: "Number of deadlines that constitutes a cluster",
            default: 3,
          },
        },
        required: [],
      },
    },
    {
      name: "find_light_days",
      description: "Find days with low task/meeting load for catch-up work",
      input_schema: {
        type: "object",
        properties: {
          days_ahead: {
            type: "integer",
            description: "Number of days to look ahead",
            default: 7,
          },
        },
        required: [],
      },
    },
    {
      name: "suggest_redistribution",
      description:
        "Suggest how to redistribute tasks when workload is unbalanced",
      input_schema: {
        type: "object",
        properties: {
          overloaded_date: {
            type: "string",
            description: "The date that's overloaded (YYYY-MM-DD)",
          },
        },
        required: ["overloaded_date"],
      },
    },
    {
      name: "get_approaching_deadlines",
      description: "Get tasks with deadlines in the next N days",
      input_schema: {
        type: "object",
        properties: {
          days: {
            type: "integer",
            description: "Number of days to look ahead",
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
      case "get_week_overview":
        return this.getWeekOverview(
          context,
          toolInput.start_date as string | undefined,
        );
      case "find_deadline_clusters":
        return this.findDeadlineClusters(
          context,
          (toolInput.days_ahead as number) ?? 14,
          (toolInput.cluster_threshold as number) ?? 3,
        );
      case "find_light_days":
        return this.findLightDays(
          context,
          (toolInput.days_ahead as number) ?? 7,
        );
      case "suggest_redistribution":
        return this.suggestRedistribution(
          context,
          toolInput.overloaded_date as string,
        );
      case "get_approaching_deadlines":
        return this.getApproachingDeadlines(
          context,
          (toolInput.days as number) ?? 3,
        );
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  private async getWeekOverview(
    context: SkillContext,
    startDate: string | undefined,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const tasks = await this.getTasksWithDeadlines(context, start, end);

    const tasksByDay = new Map<string, TaskDetails[]>();
    for (const task of tasks) {
      if (task.dueDate) {
        const dayKey = task.dueDate.toISOString().split("T")[0];
        if (!tasksByDay.has(dayKey)) {
          tasksByDay.set(dayKey, []);
        }
        tasksByDay.get(dayKey)?.push(task);
      }
    }

    const dailySummaries: Array<{
      date: string;
      day_name: string;
      tasks_due: number;
      tasks: TaskDetails[];
      meeting_density: string;
      meeting_minutes: number;
      workload_score: number;
    }> = [];
    const current = new Date(start);

    while (current < end) {
      const dateStr = current.toISOString().split("T")[0];
      const dayTasks = tasksByDay.get(dateStr) || [];

      dailySummaries.push({
        date: dateStr,
        day_name: current.toLocaleDateString("en-US", { weekday: "long" }),
        tasks_due: dayTasks.length,
        tasks: dayTasks,
        meeting_density: "moderate",
        meeting_minutes: 180,
        workload_score: this.calculateWorkloadScore(dayTasks.length, 50),
      });

      current.setDate(current.getDate() + 1);
    }

    const warnings = dailySummaries
      .filter((day) => day.workload_score > 80)
      .map(
        (day) =>
          `${day.day_name} looks overloaded (${day.tasks_due} deadlines + ${day.meeting_density} meetings)`,
      );

    const lightestDay = dailySummaries.reduce((min, day) =>
      day.workload_score < min.workload_score ? day : min,
    );
    const heaviestDay = dailySummaries.reduce((max, day) =>
      day.workload_score > max.workload_score ? day : max,
    );

    return {
      success: true,
      data: {
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        daily_summaries: dailySummaries,
        total_tasks_due: dailySummaries.reduce(
          (sum, d) => sum + d.tasks_due,
          0,
        ),
        warnings,
        lightest_day: lightestDay.day_name,
        heaviest_day: heaviestDay.day_name,
      },
    };
  }

  private async findDeadlineClusters(
    context: SkillContext,
    daysAhead: number,
    clusterThreshold: number,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + daysAhead);

    const tasks = await this.getTasksWithDeadlines(context, start, end);

    const byDate = new Map<string, TaskDetails[]>();
    for (const task of tasks) {
      if (task.dueDate) {
        const dateStr = task.dueDate.toISOString().split("T")[0];
        if (!byDate.has(dateStr)) {
          byDate.set(dateStr, []);
        }
        byDate.get(dateStr)?.push(task);
      }
    }

    const clusters: Array<{
      date: string;
      day_name: string;
      deadline_count: number;
      tasks: Array<{ title: string; priority: string }>;
      total_estimated_minutes: number;
    }> = [];

    for (const [dateStr, dateTasks] of byDate) {
      if (dateTasks.length >= clusterThreshold) {
        clusters.push({
          date: dateStr,
          day_name: new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          deadline_count: dateTasks.length,
          tasks: dateTasks.map((t) => ({
            title: t.title,
            priority: t.priority,
          })),
          total_estimated_minutes: dateTasks.reduce(
            (sum, t) => sum + (t.estimatedMinutes || 30),
            0,
          ),
        });
      }
    }

    clusters.sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        clusters,
        cluster_count: clusters.length,
        recommendation: clusters.length
          ? this.getClusterRecommendation(clusters)
          : "No deadline clusters detected—you're in good shape!",
      },
    };
  }

  private async findLightDays(
    context: SkillContext,
    daysAhead: number,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const lightDays: Array<{
      date: string;
      day_name: string;
      meeting_density: string;
      tasks_due: number;
      free_minutes: number;
      recommendation: string;
    }> = [];

    for (let i = 0; i < daysAhead; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split("T")[0];

      const tasks = await this.getTasksDueOnDate(context, current);

      if (tasks.length < 3) {
        lightDays.push({
          date: dateStr,
          day_name: current.toLocaleDateString("en-US", { weekday: "long" }),
          meeting_density: "light",
          tasks_due: tasks.length,
          free_minutes: 360,
          recommendation: "Great day for deep work or catching up on backlog",
        });
      }
    }

    return {
      success: true,
      data: {
        light_days: lightDays,
        count: lightDays.length,
        best_catch_up_day: lightDays[0] || null,
      },
    };
  }

  private async getApproachingDeadlines(
    context: SkillContext,
    days: number,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    const tasks = await this.getTasksWithDeadlines(context, start, end);
    tasks.sort(
      (a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0),
    );

    const approaching = tasks.map((task) => {
      const daysUntil = Math.floor(
        ((task.dueDate?.getTime() || 0) - start.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      let urgency: string;
      if (daysUntil === 0) {
        urgency = "today";
      } else if (daysUntil === 1) {
        urgency = "tomorrow";
      } else {
        urgency = `in ${daysUntil} days`;
      }

      return {
        id: task.id,
        title: task.title,
        due_date: task.dueDate?.toISOString().split("T")[0] || "",
        days_until_due: daysUntil,
        urgency,
        priority: task.priority,
        status: task.status,
      };
    });

    return {
      success: true,
      data: {
        approaching_deadlines: approaching,
        count: approaching.length,
        due_today: approaching.filter((t) => t.days_until_due === 0).length,
        due_tomorrow: approaching.filter((t) => t.days_until_due === 1).length,
      },
    };
  }

  private async suggestRedistribution(
    context: SkillContext,
    overloadedDate: string,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const targetDate = new Date(overloadedDate);
    const tasks = await this.getTasksDueOnDate(context, targetDate);

    const movableTasks = tasks.filter((t) => t.priority !== "high");

    const suggestions = movableTasks.slice(0, 2).map((task, idx) => ({
      task_id: task.id,
      task_title: task.title,
      current_due: overloadedDate,
      suggested_move_to: "next light day",
      reason: "Moving to lighter day for better workload balance",
    }));

    return {
      success: true,
      data: {
        overloaded_date: overloadedDate,
        task_count: tasks.length,
        movable_tasks: movableTasks.length,
        suggestions,
        recommendation: suggestions.length
          ? `Consider moving ${suggestions.length} task(s) to lighter days`
          : "All tasks are high priority—consider delegating or renegotiating deadlines",
      },
    };
  }

  private calculateWorkloadScore(
    taskCount: number,
    meetingDensity: number,
  ): number {
    const taskScore = Math.min(50, taskCount * 12.5);
    const meetingScore = meetingDensity / 2;
    return Math.floor(taskScore + meetingScore);
  }

  private getClusterRecommendation(
    clusters: Array<{ day_name: string; deadline_count: number }>,
  ): string {
    if (clusters.length === 1) {
      const c = clusters[0];
      return `${c.day_name} has ${c.deadline_count} deadlines. Consider starting some of these today.`;
    } else {
      const dates = clusters.slice(0, 3).map((c) => c.day_name);
      return `Multiple crunch days ahead: ${dates.join(", ")}. Start preparing now.`;
    }
  }

  private async getTasksWithDeadlines(
    context: SkillContext,
    startDate: Date,
    endDate: Date,
  ): Promise<TaskDetails[]> {
    // Mock implementation - replace with actual database call
    return [
      {
        id: "1",
        title: "Sample Task 1",
        priority: "high",
        energyLevel: "high",
        estimatedMinutes: 60,
        dueDate: new Date(startDate.getTime() + 86400000),
        status: "active",
      },
    ];
  }

  private async getTasksDueOnDate(
    context: SkillContext,
    date: Date,
  ): Promise<TaskDetails[]> {
    // Mock implementation - replace with actual database call
    return [];
  }
}
