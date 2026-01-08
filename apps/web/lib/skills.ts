import matter from "gray-matter";
import type { Skill, SkillResult, Tool } from "@vibe-planning/shared";
import { WorkspaceManager } from "./workspace";
import { CalendarSyncSkill } from "./skills/calendar-sync";
import { SmartSchedulingSkill } from "./skills/smart-scheduling";
import { TimeHorizonPlannerSkill } from "./skills/time-horizon-planner";

// Code-based skill registry
const codeBasedSkills: Map<
  string,
  { skill: Skill; instance: unknown; tools: Tool[] }
> = new Map([
  [
    "calendar_sync",
    {
      skill: new CalendarSyncSkill(),
      instance: null,
      tools: new CalendarSyncSkill().tools,
    },
  ],
  [
    "smart_scheduling",
    {
      skill: new SmartSchedulingSkill(),
      instance: null,
      tools: new SmartSchedulingSkill().tools,
    },
  ],
  [
    "time_horizon_planner",
    {
      skill: new TimeHorizonPlannerSkill(),
      instance: null,
      tools: new TimeHorizonPlannerSkill().tools,
    },
  ],
]);

export class SkillExecutor {
  private workspace: WorkspaceManager;

  constructor(workspace: WorkspaceManager) {
    this.workspace = workspace;
  }

  async listSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];

    // Add code-based skills first
    for (const [name, { skill }] of codeBasedSkills) {
      skills.push({
        name: skill.name,
        version: skill.version,
        description: skill.description,
        content: "",
        tools: skill.tools,
        isCodeBased: true,
      });
    }

    // Add markdown-based skills
    const mainFiles = await this.workspace.listDirectory("skills");
    for (const file of mainFiles) {
      if (!file.endsWith(".md")) continue;

      try {
        const content = await this.workspace.readFile(`skills/${file}`);
        const { data, content: body } = matter(content);

        skills.push({
          name: data.name ?? file.replace(".md", ""),
          version: data.version ?? "1.0",
          trigger: data.trigger ?? "",
          description: extractDescription(body),
          content: body,
        });
      } catch {
        continue;
      }
    }

    const metaFiles = await this.workspace.listDirectory("skills/_meta");
    for (const file of metaFiles) {
      if (!file.endsWith(".md")) continue;

      try {
        const content = await this.workspace.readFile(`skills/_meta/${file}`);
        const { data, content: body } = matter(content);

        skills.push({
          name: `_meta/${data.name ?? file.replace(".md", "")}`,
          version: data.version ?? "1.0",
          trigger: data.trigger ?? "",
          description: extractDescription(body),
          content: body,
        });
      } catch {
        continue;
      }
    }

    return skills;
  }

  async getSkill(name: string): Promise<Skill | null> {
    // Check code-based skills first
    const codeSkill = codeBasedSkills.get(name);
    if (codeSkill) {
      return {
        name: codeSkill.skill.name,
        version: codeSkill.skill.version,
        description: codeSkill.skill.description,
        content: "",
        tools: codeSkill.skill.tools,
        isCodeBased: true,
      };
    }

    // Check markdown-based skills
    const paths = [`skills/${name}.md`, `skills/_meta/${name}.md`];

    for (const path of paths) {
      try {
        const content = await this.workspace.readFile(path);
        const { data, content: body } = matter(content);

        return {
          name: data.name ?? name,
          version: data.version ?? "1.0",
          trigger: data.trigger ?? "",
          description: extractDescription(body),
          content: body,
        };
      } catch {
        continue;
      }
    }

    return null;
  }

  async execute(
    name: string,
    _params: Record<string, unknown> = {},
  ): Promise<SkillResult> {
    // Check if it's a code-based skill
    const codeSkill = codeBasedSkills.get(name);
    if (codeSkill) {
      return {
        success: true,
        output: `Code-based skill: ${name}`,
        data: {
          tools: codeSkill.skill.tools?.map((t) => t.name) || [],
        },
      };
    }

    // Fall back to markdown-based skills
    const skill = await this.getSkill(name);

    if (!skill) {
      return {
        success: false,
        output: `Skill not found: ${name}`,
      };
    }

    return {
      success: true,
      output: skill.content,
    };
  }

  // Get tools for a code-based skill
  async getSkillTools(skillName: string): Promise<Tool[]> {
    const codeSkill = codeBasedSkills.get(skillName);
    if (codeSkill) {
      return codeSkill.skill.tools || [];
    }
    return [];
  }

  // Execute a specific tool within a code-based skill
  async executeTool(
    skillName: string,
    toolName: string,
    toolInput: Record<string, unknown>,
    context: { userId: string },
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const codeSkill = codeBasedSkills.get(skillName);
    if (!codeSkill) {
      return { success: false, error: `Skill not found: ${skillName}` };
    }

    const skillInstance = codeSkill.instance as {
      execute: (
        tool: string,
        input: Record<string, unknown>,
        ctx: { userId: string },
      ) => Promise<{ success: boolean; data?: unknown; error?: string }>;
    };
    if (!skillInstance || typeof skillInstance.execute !== "function") {
      return {
        success: false,
        error: `Skill ${skillName} does not have an execute method`,
      };
    }

    return skillInstance.execute(toolName, toolInput, context);
  }
}

function extractDescription(body: string): string {
  const purposeMatch = body.match(/## Purpose\n([\s\S]*?)(?=\n## |\n*$)/);
  if (purposeMatch) return purposeMatch[1].trim();

  const lines = body.split("\n").filter((l) => l.trim());
  return lines[0]?.replace(/^#+ /, "") ?? "";
}
