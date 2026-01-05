import fs from "fs/promises";
import path from "path";
import {
  DATA_ROOT,
  WORKSPACE_DIRS,
  DEFAULT_TIMEZONE,
} from "@vibe-planning/shared";
import type { SearchResult, WorkspaceConfig } from "@vibe-planning/shared";

let workspaceInstance: WorkspaceManager | null = null;

export class WorkspaceManager {
  private basePath: string;

  constructor() {
    this.basePath = DATA_ROOT;
  }

  static getInstance(): WorkspaceManager {
    if (!workspaceInstance) {
      workspaceInstance = new WorkspaceManager();
    }
    return workspaceInstance;
  }

  async initialize(): Promise<void> {
    for (const dir of WORKSPACE_DIRS) {
      await fs.mkdir(path.join(this.basePath, dir), { recursive: true });
    }

    const configExists = await this.exists();
    if (!configExists) {
      await this.copyDefaultSkills();
      await this.createConfig();
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, "meta/config.json"));
      return true;
    } catch {
      return false;
    }
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, relativePath);
    return fs.readFile(fullPath, "utf-8");
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    await fs.unlink(fullPath);
  }

  async moveFile(fromPath: string, toPath: string): Promise<void> {
    const fullFromPath = path.join(this.basePath, fromPath);
    const fullToPath = path.join(this.basePath, toPath);
    await fs.mkdir(path.dirname(fullToPath), { recursive: true });
    await fs.rename(fullFromPath, fullToPath);
  }

  async listDirectory(relativePath: string): Promise<string[]> {
    const fullPath = path.join(this.basePath, relativePath);
    try {
      return await fs.readdir(fullPath);
    } catch {
      return [];
    }
  }

  async searchFiles(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    await this.searchRecursive(this.basePath, query.toLowerCase(), results);
    return results;
  }

  async getConfig(): Promise<WorkspaceConfig> {
    const content = await this.readFile("meta/config.json");
    return JSON.parse(content);
  }

  async updateConfig(updates: Partial<WorkspaceConfig>): Promise<void> {
    const config = await this.getConfig();
    const updated = {
      ...config,
      ...updates,
      lastActive: new Date().toISOString(),
    };
    await this.writeFile("meta/config.json", JSON.stringify(updated, null, 2));
  }

  private async searchRecursive(
    dir: string,
    query: string,
    results: SearchResult[],
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.searchRecursive(fullPath, query, results);
      } else if (entry.name.endsWith(".md")) {
        const content = await fs.readFile(fullPath, "utf-8");
        if (content.toLowerCase().includes(query)) {
          results.push({
            path: fullPath.replace(this.basePath, ""),
            snippet: this.extractSnippet(content, query),
          });
        }
      }
    }
  }

  private extractSnippet(content: string, query: string): string {
    const lowerContent = content.toLowerCase();
    const index = lowerContent.indexOf(query);
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    return "..." + content.slice(start, end) + "...";
  }

  private async copyDefaultSkills(): Promise<void> {
    const defaultSkillsPath = path.join(process.cwd(), "skills");

    try {
      const skills = await fs.readdir(defaultSkillsPath);

      for (const skill of skills) {
        const content = await fs.readFile(
          path.join(defaultSkillsPath, skill),
          "utf-8",
        );
        await this.writeFile(`skills/${skill}`, content);
      }
    } catch {
      console.warn("Default skills not found, skipping copy");
    }
  }

  private async createConfig(): Promise<void> {
    const config: WorkspaceConfig = {
      timezone: DEFAULT_TIMEZONE,
      preferences: {},
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    await this.writeFile("meta/config.json", JSON.stringify(config, null, 2));
  }
}
