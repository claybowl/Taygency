import { google, calendar_v3 } from "googleapis";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  location?: string;
  description?: string;
}

export interface CalendarClient {
  getEvents(params: { start: Date; end: Date }): Promise<CalendarEvent[]>;
}

export class GoogleCalendarClient implements CalendarClient {
  private calendar: calendar_v3.Calendar;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    // In production, you'd retrieve the user's refresh token from storage
    // For now, this is a placeholder that demonstrates the structure
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  async getEvents(params: {
    start: Date;
    end: Date;
  }): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: params.start.toISOString(),
        timeMax: params.end.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];

      return events.map((event) => ({
        id: event.id || "",
        title: event.summary || "Untitled",
        start: new Date(event.start?.dateTime || event.start?.date || ""),
        end: new Date(event.end?.dateTime || event.end?.date || ""),
        isAllDay: !!event.start?.date && !event.start?.dateTime,
        location: event.location ?? undefined,
        description: event.description ?? undefined,
      }));
    } catch (error) {
      console.error("[GoogleCalendar] Error fetching events:", error);
      return [];
    }
  }
}

// Mock calendar client for development without credentials
export class MockCalendarClient implements CalendarClient {
  private mockEvents: CalendarEvent[] = [];

  constructor() {
    // Generate some mock events for development
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.mockEvents = [
      {
        id: "mock-1",
        title: "Team Standup",
        start: new Date(today.setHours(10, 0, 0, 0)),
        end: new Date(today.setHours(10, 30, 0, 0)),
        isAllDay: false,
        location: "Zoom",
      },
      {
        id: "mock-2",
        title: "Lunch Meeting",
        start: new Date(today.setHours(12, 30, 0, 0)),
        end: new Date(today.setHours(13, 30, 0, 0)),
        isAllDay: false,
        location: "Downtown Cafe",
      },
      {
        id: "mock-3",
        title: "Code Review",
        start: new Date(today.setHours(15, 0, 0, 0)),
        end: new Date(today.setHours(16, 0, 0, 0)),
        isAllDay: false,
      },
    ];
  }

  async getEvents(params: {
    start: Date;
    end: Date;
  }): Promise<CalendarEvent[]> {
    // Filter mock events to the requested range
    return this.mockEvents.filter(
      (event) => event.start >= params.start && event.start < params.end,
    );
  }
}

// Factory function to get the appropriate calendar client
export async function getCalendarClient(
  userId: string,
): Promise<CalendarClient> {
  const hasGoogleCredentials = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN,
  );

  if (hasGoogleCredentials) {
    return new GoogleCalendarClient(userId);
  }

  // Return mock client for development
  console.warn(
    "[Calendar] Using mock calendar client - set GOOGLE_* credentials for real data",
  );
  return new MockCalendarClient();
}
