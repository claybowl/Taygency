import { NextResponse } from "next/server";
import { SkillExecutor } from "@/lib/skills";
import { WorkspaceManager } from "@/lib/workspace";
import { SKILL_GROUPS, type SkillGroupSkill } from "@/lib/skill-groups";
import type { Skill, Tool } from "@vibe-planning/shared";

export interface SkillWithMeta extends Skill {
  displayName: string;
  groupId: string;
  groupName: string;
  groupEmoji: string;
  status: "implemented" | "coming_soon";
}

export interface SkillsApiResponse {
  skills: SkillWithMeta[];
  groups: typeof SKILL_GROUPS;
  stats: {
    total: number;
    implemented: number;
    comingSoon: number;
    totalTools: number;
  };
}

function findSkillInGroups(skillName: string): {
  group: (typeof SKILL_GROUPS)[0];
  skillDef: SkillGroupSkill;
} | null {
  for (const group of SKILL_GROUPS) {
    const skillDef = group.skills.find((s) => s.name === skillName);
    if (skillDef) {
      return { group, skillDef };
    }
  }
  return null;
}

export async function GET() {
  try {
    const workspace = new WorkspaceManager();
    const executor = new SkillExecutor(workspace);

    const implementedSkills = await executor.listSkills();

    const skillsWithMeta: SkillWithMeta[] = [];
    let totalTools = 0;

    for (const group of SKILL_GROUPS) {
      for (const skillDef of group.skills) {
        if (skillDef.status === "implemented") {
          const implSkill = implementedSkills.find(
            (s) => s.name === skillDef.name,
          );
          if (implSkill) {
            totalTools += implSkill.tools?.length || 0;
            skillsWithMeta.push({
              ...implSkill,
              displayName:
                skillDef.displayName || formatSkillName(skillDef.name),
              groupId: group.id,
              groupName: group.name,
              groupEmoji: group.emoji,
              status: "implemented",
            });
          }
        } else {
          skillsWithMeta.push({
            name: skillDef.name,
            version: "0.0.0",
            description: skillDef.description || "",
            content: "",
            tools: [],
            isCodeBased: false,
            displayName: skillDef.displayName || formatSkillName(skillDef.name),
            groupId: group.id,
            groupName: group.name,
            groupEmoji: group.emoji,
            status: "coming_soon",
          });
        }
      }
    }

    const implemented = skillsWithMeta.filter(
      (s) => s.status === "implemented",
    ).length;

    const response: SkillsApiResponse = {
      skills: skillsWithMeta,
      groups: SKILL_GROUPS,
      stats: {
        total: skillsWithMeta.length,
        implemented,
        comingSoon: skillsWithMeta.length - implemented,
        totalTools,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /skills] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 },
    );
  }
}

function formatSkillName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
