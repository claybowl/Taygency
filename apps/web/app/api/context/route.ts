import { NextResponse } from "next/server";
import { getGitHubStorage } from "@/lib/github-storage";

const CONTEXT_DIR = "context";

export interface ContextFile {
  name: string;
  path: string;
  content: string;
  lastModified?: string;
}

export interface ParsedPreferences {
  communication: {
    responseLength: string;
    tone: string;
    greetings: string;
  };
  taskManagement: {
    dailyMitCount: number;
    showCategories: boolean;
    includeEnergyLevels: boolean;
  };
  temporal: {
    timezone: string;
    peakHours: string[];
    planningTime: string;
    busyDays: string[];
  };
}

export interface ParsedPatterns {
  interactions: {
    morningCount: number;
    afternoonCount: number;
    eveningCount: number;
  };
  channels: {
    emailCount: number;
    smsCount: number;
  };
}

export interface ParsedSchedule {
  workHours: {
    start: string;
    end: string;
    days: string[];
  };
  regularCommitments: string[];
  blockedTime: string[];
  upcomingEvents: string[];
}

export interface ContextApiResponse {
  files: ContextFile[];
  preferences: ParsedPreferences | null;
  patterns: ParsedPatterns | null;
  schedule: ParsedSchedule | null;
  commitments: string;
}

function parsePreferences(content: string): ParsedPreferences {
  const getValue = (pattern: RegExp, defaultVal: string): string => {
    const match = content.match(pattern);
    return match ? match[1].trim() : defaultVal;
  };

  const getNumber = (pattern: RegExp, defaultVal: number): number => {
    const match = content.match(pattern);
    return match ? parseInt(match[1], 10) : defaultVal;
  };

  const getBool = (pattern: RegExp, defaultVal: boolean): boolean => {
    const match = content.match(pattern);
    return match ? match[1].trim() === "true" : defaultVal;
  };

  const getArray = (pattern: RegExp): string[] => {
    const match = content.match(pattern);
    if (!match) return [];
    try {
      const arr = JSON.parse(match[1].replace(/'/g, '"'));
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  return {
    communication: {
      responseLength: getValue(/response_length:\s*(.+)/, "adaptive"),
      tone: getValue(/tone:\s*(.+)/, "friendly"),
      greetings: getValue(/greetings:\s*(.+)/, "time-aware"),
    },
    taskManagement: {
      dailyMitCount: getNumber(/daily_mit_count:\s*(\d+)/, 5),
      showCategories: getBool(/show_categories:\s*(.+)/, true),
      includeEnergyLevels: getBool(/include_energy_levels:\s*(.+)/, true),
    },
    temporal: {
      timezone: getValue(/timezone:\s*(.+)/, "UTC"),
      peakHours: getArray(/peak_hours:\s*(\[.*?\])/),
      planningTime: getValue(/planning_time:\s*(.+)/, "unknown"),
      busyDays: getArray(/busy_days:\s*(\[.*?\])/),
    },
  };
}

function parsePatterns(content: string): ParsedPatterns {
  const getNumber = (pattern: RegExp, defaultVal: number): number => {
    const match = content.match(pattern);
    return match ? parseInt(match[1], 10) : defaultVal;
  };

  return {
    interactions: {
      morningCount: getNumber(/morning_interactions:\s*(\d+)/, 0),
      afternoonCount: getNumber(/afternoon_interactions:\s*(\d+)/, 0),
      eveningCount: getNumber(/evening_interactions:\s*(\d+)/, 0),
    },
    channels: {
      emailCount: getNumber(/email_count:\s*(\d+)/, 0),
      smsCount: getNumber(/sms_count:\s*(\d+)/, 0),
    },
  };
}

function parseSchedule(content: string): ParsedSchedule {
  const getValue = (pattern: RegExp, defaultVal: string): string => {
    const match = content.match(pattern);
    return match ? match[1].trim() : defaultVal;
  };

  const getArray = (pattern: RegExp): string[] => {
    const match = content.match(pattern);
    if (!match) return [];
    try {
      const arr = JSON.parse(match[1].replace(/'/g, '"'));
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  return {
    workHours: {
      start: getValue(/start:\s*(.+)/, "unknown"),
      end: getValue(/end:\s*(.+)/, "unknown"),
      days: getArray(/days:\s*(\[.*?\])/),
    },
    regularCommitments: [],
    blockedTime: [],
    upcomingEvents: [],
  };
}

export async function GET() {
  try {
    const storage = getGitHubStorage();
    const contextFiles = await storage.listDirectory(CONTEXT_DIR);

    const files: ContextFile[] = [];
    let preferences: ParsedPreferences | null = null;
    let patterns: ParsedPatterns | null = null;
    let schedule: ParsedSchedule | null = null;
    let commitments = "";

    for (const filename of contextFiles) {
      if (filename === ".gitkeep") continue;

      try {
        const content = await storage.readFile(`${CONTEXT_DIR}/${filename}`);
        files.push({
          name: filename,
          path: `${CONTEXT_DIR}/${filename}`,
          content,
        });

        if (filename === "preferences.md") {
          preferences = parsePreferences(content);
        } else if (filename === "patterns.md") {
          patterns = parsePatterns(content);
        } else if (filename === "schedule.md") {
          schedule = parseSchedule(content);
        } else if (filename === "upcoming-commitments.md") {
          commitments = content;
        }
      } catch (err) {
        console.warn(`[Context API] Failed to read ${filename}:`, err);
      }
    }

    const response: ContextApiResponse = {
      files,
      preferences,
      patterns,
      schedule,
      commitments,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /context] Error:", error);
    return NextResponse.json(
      {
        files: [],
        preferences: null,
        patterns: null,
        schedule: null,
        commitments: "",
      } as ContextApiResponse,
      { status: 500 },
    );
  }
}
