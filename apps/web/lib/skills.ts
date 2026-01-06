import matter from "gray-matter";
import type { Skill, SkillResult } from "@vibe-planning/shared";
import { WorkspaceManager } from "./workspace";

export class SkillExecutor {
  private workspace: WorkspaceManager;

  constructor(workspace: WorkspaceManager) {
    this.workspace = workspace;
  }

  async listSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];

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
}

function extractDescription(body: string): string {
  const purposeMatch = body.match(/## Purpose\n([\s\S]*?)(?=\n## |\n*$)/);
  if (purposeMatch) return purposeMatch[1].trim();

  const lines = body.split("\n").filter((l) => l.trim());
  return lines[0]?.replace(/^#+ /, "") ?? "";
}
