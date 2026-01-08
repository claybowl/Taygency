export interface SkillGroupSkill {
  name: string;
  status: "implemented" | "coming_soon";
  description?: string;
  displayName?: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  emoji: string;
  skills: SkillGroupSkill[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: "time-foundation",
    name: "Time Foundation",
    emoji: "⏰",
    skills: [
      {
        name: "calendar_sync",
        status: "implemented",
        displayName: "Calendar Sync",
      },
      {
        name: "smart_scheduling",
        status: "implemented",
        displayName: "Smart Scheduling",
      },
      {
        name: "time_horizon_planner",
        status: "implemented",
        displayName: "Time Horizon Planner",
      },
    ],
  },
  {
    id: "repeating-patterns",
    name: "Repeating Patterns",
    emoji: "🔁",
    skills: [
      {
        name: "recurring_task_engine",
        status: "coming_soon",
        displayName: "Recurring Task Engine",
        description:
          "Manage recurring tasks with flexible schedules and smart rescheduling",
      },
      {
        name: "habit_tracker",
        status: "coming_soon",
        displayName: "Habit Tracker",
        description:
          "Track daily habits, maintain streaks, and build consistency",
      },
      {
        name: "bill_reminder",
        status: "coming_soon",
        displayName: "Subscription & Bill Reminder",
        description: "Never miss subscription renewals or bill payments",
      },
    ],
  },
  {
    id: "memory-context",
    name: "Memory & Context",
    emoji: "🧠",
    skills: [
      {
        name: "people_memory",
        status: "coming_soon",
        displayName: "People Memory",
        description:
          "Remember important details about people you interact with",
      },
      {
        name: "gift_preference_tracker",
        status: "coming_soon",
        displayName: "Gift & Preference Tracker",
        description:
          "Track gift ideas, preferences, and important dates for loved ones",
      },
      {
        name: "past_task_recall",
        status: "coming_soon",
        displayName: "Past Task Recall",
        description: "Recall context and learnings from previous similar tasks",
      },
    ],
  },
  {
    id: "vapi-voice",
    name: "Vapi Voice Routines",
    emoji: "📞",
    skills: [
      {
        name: "morning_briefing_call",
        status: "coming_soon",
        displayName: "Morning Briefing Call",
        description:
          "Start your day with a personalized voice briefing of tasks and calendar",
      },
      {
        name: "end_of_day_recap",
        status: "coming_soon",
        displayName: "End-of-Day Recap Call",
        description: "Review accomplishments and plan tomorrow via voice call",
      },
      {
        name: "accountability_checkin",
        status: "coming_soon",
        displayName: "Accountability Check-In",
        description: "Regular voice check-ins to keep you on track with goals",
      },
    ],
  },
  {
    id: "intelligent-capture",
    name: "Intelligent Capture",
    emoji: "🎯",
    skills: [
      {
        name: "voice_note_to_task",
        status: "coming_soon",
        displayName: "Voice Note → Task",
        description:
          "Convert rambling voice notes into structured, actionable tasks",
      },
      {
        name: "energy_matcher",
        status: "coming_soon",
        displayName: "Energy Matcher",
        description:
          "Match tasks to your current energy level for optimal productivity",
      },
      {
        name: "procrastination_detector",
        status: "coming_soon",
        displayName: "Procrastination Detector",
        description:
          "Identify procrastination patterns and suggest interventions",
      },
    ],
  },
  {
    id: "planning-review",
    name: "Planning & Review",
    emoji: "📊",
    skills: [
      {
        name: "deadline_cascade",
        status: "coming_soon",
        displayName: "Deadline Cascade",
        description:
          "Break big deadlines into manageable milestones automatically",
      },
      {
        name: "someday_promoter",
        status: "coming_soon",
        displayName: "Someday Promoter",
        description: "Surface 'someday' tasks when capacity and context align",
      },
      {
        name: "weekly_review_generator",
        status: "coming_soon",
        displayName: "Weekly Review Generator",
        description:
          "Generate comprehensive weekly reviews with insights and planning",
      },
    ],
  },
  {
    id: "learning-motivation",
    name: "Learning & Motivation",
    emoji: "📈",
    skills: [
      {
        name: "time_estimation_learner",
        status: "coming_soon",
        displayName: "Time Estimation Learner",
        description:
          "Improve time estimates by learning from your actual completion patterns",
      },
      {
        name: "accomplishment_log",
        status: "coming_soon",
        displayName: "Accomplishment Log",
        description: "Track and celebrate your wins to maintain motivation",
      },
    ],
  },
];

export function getImplementedSkillNames(): string[] {
  return SKILL_GROUPS.flatMap((group) =>
    group.skills.filter((s) => s.status === "implemented").map((s) => s.name),
  );
}

export function getComingSoonSkillNames(): string[] {
  return SKILL_GROUPS.flatMap((group) =>
    group.skills.filter((s) => s.status === "coming_soon").map((s) => s.name),
  );
}

export function findSkillGroup(skillName: string): SkillGroup | undefined {
  return SKILL_GROUPS.find((group) =>
    group.skills.some((s) => s.name === skillName),
  );
}

export function formatSkillName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
