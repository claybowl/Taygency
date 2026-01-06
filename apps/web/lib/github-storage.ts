import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "Claybowl";
const GITHUB_REPO = process.env.GITHUB_REPO || "Taygency";
const DATA_PATH_PREFIX = process.env.GITHUB_DATA_PATH || "task-data";

let octokitInstance: Octokit | null = null;

function getOctokit(): Octokit {
  if (!octokitInstance) {
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN environment variable is required");
    }
    octokitInstance = new Octokit({ auth: GITHUB_TOKEN });
  }
  return octokitInstance;
}

export interface GitHubFile {
  path: string;
  content: string;
  sha?: string;
}

export interface GitHubFileInfo {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
}

export class GitHubStorageManager {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private basePath: string;
  private fileCache: Map<
    string,
    { content: string; sha: string; timestamp: number }
  >;
  private cacheTTL: number = 60000;

  constructor() {
    this.octokit = getOctokit();
    this.owner = GITHUB_OWNER;
    this.repo = GITHUB_REPO;
    this.basePath = DATA_PATH_PREFIX;
    this.fileCache = new Map();
  }

  private getFullPath(relativePath: string): string {
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;
    return `${this.basePath}/${cleanPath}`;
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = this.getFullPath(relativePath);

    const cached = this.fileCache.get(fullPath);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.content;
    }

    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (Array.isArray(response.data) || response.data.type !== "file") {
        throw new Error(`Path is not a file: ${fullPath}`);
      }

      const content = Buffer.from(response.data.content, "base64").toString(
        "utf-8",
      );

      this.fileCache.set(fullPath, {
        content,
        sha: response.data.sha,
        timestamp: Date.now(),
      });

      return content;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        throw new Error(`File not found: ${fullPath}`);
      }
      throw error;
    }
  }

  async writeFile(
    relativePath: string,
    content: string,
    message?: string,
  ): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    const commitMessage = message || `Update ${relativePath.split("/").pop()}`;

    let sha: string | undefined;
    try {
      const cached = this.fileCache.get(fullPath);
      if (cached) {
        sha = cached.sha;
      } else {
        const existing = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: fullPath,
        });
        if (!Array.isArray(existing.data) && existing.data.type === "file") {
          sha = existing.data.sha;
        }
      }
    } catch (error: unknown) {
      if (
        !(
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 404
        )
      ) {
        throw error;
      }
    }

    const response = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: fullPath,
      message: commitMessage,
      content: Buffer.from(content, "utf-8").toString("base64"),
      sha,
    });

    if (response.data.content?.sha) {
      this.fileCache.set(fullPath, {
        content,
        sha: response.data.content.sha,
        timestamp: Date.now(),
      });
    }
  }

  async deleteFile(relativePath: string, message?: string): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    const commitMessage = message || `Delete ${relativePath.split("/").pop()}`;

    let sha: string;
    const cached = this.fileCache.get(fullPath);
    if (cached) {
      sha = cached.sha;
    } else {
      const existing = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });
      if (Array.isArray(existing.data) || existing.data.type !== "file") {
        throw new Error(`Cannot delete: ${fullPath} is not a file`);
      }
      sha = existing.data.sha;
    }

    await this.octokit.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      path: fullPath,
      message: commitMessage,
      sha,
    });

    this.fileCache.delete(fullPath);
  }

  async moveFile(
    fromPath: string,
    toPath: string,
    message?: string,
  ): Promise<void> {
    const content = await this.readFile(fromPath);
    const commitMessage =
      message ||
      `Move ${fromPath.split("/").pop()} to ${toPath.split("/").pop()}`;

    await this.writeFile(toPath, content, commitMessage);
    await this.deleteFile(fromPath, commitMessage);
  }

  async listDirectory(relativePath: string): Promise<string[]> {
    const fullPath = this.getFullPath(relativePath);

    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (!Array.isArray(response.data)) {
        throw new Error(`Path is not a directory: ${fullPath}`);
      }

      return response.data
        .filter((item: { type: string }) => item.type === "file")
        .map((item: { name: string }) => item.name);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        return [];
      }
      throw error;
    }
  }

  async listSubdirectories(relativePath: string): Promise<string[]> {
    const fullPath = this.getFullPath(relativePath);

    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (!Array.isArray(response.data)) {
        throw new Error(`Path is not a directory: ${fullPath}`);
      }

      return response.data
        .filter((item: { type: string }) => item.type === "dir")
        .map((item: { name: string }) => item.name);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        return [];
      }
      throw error;
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(relativePath);

    try {
      await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });
      return true;
    } catch (error: unknown) {
      // Suppress all errors - if it doesn't exist, return false
      // This prevents crashes from rate limiting, network issues, etc.
      return false;
    }
  }

  async searchFiles(
    query: string,
    directory?: string,
  ): Promise<Array<{ path: string; snippet: string }>> {
    const results: Array<{ path: string; snippet: string }> = [];
    const searchPath = directory || "";

    await this.searchRecursive(searchPath, query.toLowerCase(), results);

    return results;
  }

  private async searchRecursive(
    directory: string,
    query: string,
    results: Array<{ path: string; snippet: string }>,
  ): Promise<void> {
    const fullPath = this.getFullPath(directory);

    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (!Array.isArray(response.data)) {
        return;
      }

      for (const item of response.data) {
        if (item.type === "dir") {
          const subDir = directory ? `${directory}/${item.name}` : item.name;
          await this.searchRecursive(subDir, query, results);
        } else if (item.type === "file" && item.name.endsWith(".md")) {
          try {
            const relativePath = directory
              ? `${directory}/${item.name}`
              : item.name;
            const content = await this.readFile(relativePath);
            if (content.toLowerCase().includes(query)) {
              results.push({
                path: relativePath,
                snippet: this.extractSnippet(content, query),
              });
            }
          } catch {
            continue;
          }
        }
      }
    } catch {
      return;
    }
  }

  private extractSnippet(content: string, query: string): string {
    const lowerContent = content.toLowerCase();
    const index = lowerContent.indexOf(query);
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    return "..." + content.slice(start, end) + "...";
  }

  async initializeWorkspace(): Promise<void> {
    const directories = [
      "meta",
      "inbox",
      "tasks/active",
      "tasks/completed",
      "tasks/someday",
      "context",
      "skills",
      "conversations",
    ];

    for (const dir of directories) {
      const gitkeepPath = `${dir}/.gitkeep`;
      const exists = await this.exists(gitkeepPath);
      if (!exists) {
        await this.writeFile(gitkeepPath, "", `Initialize ${dir} directory`);
      }
    }
  }

  clearCache(): void {
    this.fileCache.clear();
  }
}

let storageInstance: GitHubStorageManager | null = null;

export function getGitHubStorage(): GitHubStorageManager {
  if (!storageInstance) {
    storageInstance = new GitHubStorageManager();
  }
  return storageInstance;
}
