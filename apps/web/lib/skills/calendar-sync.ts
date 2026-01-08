import type { Tool, Skill } from "@vibe-planning/shared";
import {
  getCalendarClient,
  type CalendarClient,
} from "../integrations/google-calendar";

interface SkillContext {
  userId: string;
}

export class CalendarSyncSkill implements Skill {
  name = "calendar_sync";
  version = "1.0.0";
  trigger =
    "checking calendar availability, finding free time, scheduling around meetings";
  description =
    "Access user's calendar to find free time and schedule awareness";
  content = "";

  tools: Tool[] = [
    {
      name: "get_todays_events",
      description: "Get all calendar events for today",
      input_schema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "get_events_for_date_range",
      description: "Get calendar events for a specific date range",
      input_schema: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            description: "Start date (YYYY-MM-DD)",
          },
          end_date: {
            type: "string",
            description: "End date (YYYY-MM-DD)",
          },
        },
        required: ["start_date", "end_date"],
      },
    },
    {
      name: "find_free_windows",
      description: "Find available time windows of a minimum duration",
      input_schema: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date to check (YYYY-MM-DD)",
          },
          min_duration_minutes: {
            type: "integer",
            description: "Minimum window size in minutes",
            default: 30,
          },
          work_hours_only: {
            type: "boolean",
            description: "Only return windows during work hours (9am-6pm)",
            default: true,
          },
        },
        required: ["date"],
      },
    },
    {
      name: "get_day_density",
      description: "Get a summary of how packed a day is with meetings",
      input_schema: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date to analyze (YYYY-MM-DD)",
          },
        },
        required: ["date"],
      },
    },
  ];

  async execute(
    toolName: string,
    toolInput: Record<string, unknown>,
    context: SkillContext,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const { userId } = context;
    const calendarClient = await getCalendarClient(userId);

    switch (toolName) {
      case "get_todays_events":
        return this.getTodaysEvents(calendarClient);
      case "get_events_for_date_range":
        return this.getEventsForRange(
          calendarClient,
          toolInput.start_date as string,
          toolInput.end_date as string,
        );
      case "find_free_windows":
        return this.findFreeWindows(
          calendarClient,
          toolInput.date as string,
          (toolInput.min_duration_minutes as number) ?? 30,
          (toolInput.work_hours_only as boolean) ?? true,
        );
      case "get_day_density":
        return this.getDayDensity(calendarClient, toolInput.date as string);
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  private async getTodaysEvents(client: CalendarClient) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await client.getEvents({ start: today, end: tomorrow });

    return {
      success: true,
      data: {
        date: today.toISOString().split("T")[0],
        event_count: events.length,
        events: events.map((e) => ({
          title: e.title,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          is_all_day: e.isAllDay,
          location: e.location,
        })),
      },
    };
  }

  private async getEventsForRange(
    client: CalendarClient,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);

    const events = await client.getEvents({ start, end });

    return {
      success: true,
      data: {
        start_date: startDate,
        end_date: endDate,
        event_count: events.length,
        events: events.map((e) => ({
          title: e.title,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          is_all_day: e.isAllDay,
          location: e.location,
        })),
      },
    };
  }

  private async findFreeWindows(
    client: CalendarClient,
    date: string,
    minDurationMinutes: number,
    workHoursOnly: boolean,
  ) {
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    const dayEnd = new Date(targetDate);

    if (workHoursOnly) {
      dayStart.setHours(9, 0, 0, 0);
      dayEnd.setHours(18, 0, 0, 0);
    } else {
      dayStart.setHours(7, 0, 0, 0);
      dayEnd.setHours(22, 0, 0, 0);
    }

    const events = await client.getEvents({ start: dayStart, end: dayEnd });
    const sortedEvents = events.sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    const freeWindows: Array<{
      start: string;
      end: string;
      duration_minutes: number;
    }> = [];
    let currentTime = new Date(dayStart);

    for (const event of sortedEvents) {
      if (event.start > currentTime) {
        const gapMinutes =
          (event.start.getTime() - currentTime.getTime()) / (1000 * 60);
        if (gapMinutes >= minDurationMinutes) {
          freeWindows.push({
            start: currentTime.toISOString(),
            end: event.start.toISOString(),
            duration_minutes: Math.floor(gapMinutes),
          });
        }
      }
      currentTime = new Date(
        Math.max(currentTime.getTime(), event.end.getTime()),
      );
    }

    if (currentTime < dayEnd) {
      const gapMinutes =
        (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
      if (gapMinutes >= minDurationMinutes) {
        freeWindows.push({
          start: currentTime.toISOString(),
          end: dayEnd.toISOString(),
          duration_minutes: Math.floor(gapMinutes),
        });
      }
    }

    return {
      success: true,
      data: {
        date,
        free_windows: freeWindows,
        total_free_minutes: freeWindows.reduce(
          (sum, w) => sum + w.duration_minutes,
          0,
        ),
      },
    };
  }

  private async getDayDensity(client: CalendarClient, date: string) {
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const events = await client.getEvents({ start: dayStart, end: dayEnd });

    const totalMeetingMinutes = events
      .filter((e) => !e.isAllDay)
      .reduce(
        (sum, e) => sum + (e.end.getTime() - e.start.getTime()) / (1000 * 60),
        0,
      );

    const workDayMinutes = 9 * 60;
    const densityPercent = Math.min(
      100,
      (totalMeetingMinutes / workDayMinutes) * 100,
    );

    let densityLabel: string;
    let recommendation: string;

    if (densityPercent < 25) {
      densityLabel = "light";
      recommendation = "Great day for deep focus work";
    } else if (densityPercent < 50) {
      densityLabel = "moderate";
      recommendation = "Mix of meetings and focus time available";
    } else if (densityPercent < 75) {
      densityLabel = "busy";
      recommendation = "Limited focus time—prioritize quick tasks";
    } else {
      densityLabel = "packed";
      recommendation = "Meeting-heavy day—defer deep work if possible";
    }

    return {
      success: true,
      data: {
        date,
        event_count: events.length,
        total_meeting_minutes: Math.floor(totalMeetingMinutes),
        density_percent: Math.round(densityPercent * 10) / 10,
        density_label: densityLabel,
        recommendation,
      },
    };
  }
}
