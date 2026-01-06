import { GitHubStorageManager, getGitHubStorage } from "./github-storage";
import type { SearchResult, WorkspaceConfig } from "@vibe-planning/shared";
import { DEFAULT_TIMEZONE, WORKSPACE_DIRS } from "@vibe-planning/shared";

let workspaceInstance: WorkspaceManager | null = null;

export class WorkspaceManager {
  private storage: GitHubStorageManager;

  constructor() {
    this.storage = getGitHubStorage();
  }

  static getInstance(): WorkspaceManager {
    if (!workspaceInstance) {
      workspaceInstance = new WorkspaceManager();
    }
    return workspaceInstance;
  }

  async initialize(): Promise<void> {
    await this.storage.initializeWorkspace();

    const configExists = await this.exists();
    if (!configExists) {
      await this.copyDefaultSkills();
      await this.createConfig();
    }
  }

  async exists(): Promise<boolean> {
    return this.storage.exists("meta/config.json");
  }

  async readFile(relativePath: string): Promise<string> {
    return this.storage.readFile(relativePath);
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    return this.storage.writeFile(relativePath, content);
  }

  async deleteFile(relativePath: string): Promise<void> {
    return this.storage.deleteFile(relativePath);
  }

  async moveFile(fromPath: string, toPath: string): Promise<void> {
    return this.storage.moveFile(fromPath, toPath);
  }

  async listDirectory(relativePath: string): Promise<string[]> {
    return this.storage.listDirectory(relativePath);
  }

  async searchFiles(query: string): Promise<SearchResult[]> {
    return this.storage.searchFiles(query);
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

  private async copyDefaultSkills(): Promise<void> {
    const defaultSkills = {
      "categorize.md": `---
name: categorize
version: "1.0"
trigger: "new tasks imported or user requests categorization"
---

# Skill: Categorize Tasks

## Purpose
Organize tasks into meaningful categories based on context, location, energy required, and type of work.

## Default Categories
- **work**: Professional tasks, job-related
- **personal**: Personal life, relationships
- **home**: House maintenance, chores
- **errands**: Outside-the-house tasks
- **health**: Exercise, medical, wellness
- **finance**: Money-related tasks
- **learning**: Education, skill development
- **someday**: No urgency, future consideration

## Process
1. Read the task title and any notes
2. Identify keywords and context clues
3. Assign primary category
4. Assign secondary context tags if applicable
5. Estimate energy level (high/medium/low)
6. Estimate duration if not specified

## Examples
- "Call dentist" → health, low energy, 5min
- "Finish Q4 report" → work, high energy, 2hr
- "Buy birthday gift for mom" → personal + errands, medium energy, 30min

## Output
Update the task file with:
- category: primary category
- energy: low | medium | high
- duration: estimated time
- context: array of relevant tags
`,
      "prioritize.md": `---
name: prioritize
version: "1.0"
trigger: "user asks what to do or requests prioritization"
---

# Skill: Prioritize Tasks

## Purpose
Help users focus on what matters most by ranking tasks based on urgency, importance, and context.

## Prioritization Framework
1. **Due date proximity**: Tasks due soon get higher priority
2. **Impact**: High-impact tasks over low-impact
3. **Energy match**: Match task energy to current energy level
4. **Context fit**: Tasks that fit current location/tools available
5. **Dependencies**: Tasks blocking other work

## Priority Levels
- **high**: Must do today/ASAP, deadline imminent, blocking others
- **medium**: Should do this week, important but not urgent
- **low**: Nice to do, no deadline, can wait

## Process
1. List all active tasks
2. Check for due dates within 24-48 hours → high priority
3. Identify tasks with high impact → boost priority
4. Consider current time of day and energy patterns
5. Return top 3-5 tasks to focus on

## Output Format
"Here are your top priorities:
1. [Task] - [reason it's priority]
2. [Task] - [reason]
3. [Task] - [reason]"
`,
      "daily-planning.md": `---
name: daily-planning
version: "1.0"
trigger: "user asks for daily plan or what to do today"
---

# Skill: Daily Planning

## Purpose
Create a realistic, energy-aware plan for the day.

## Process
1. Check current time and remaining hours in workday
2. Review all active tasks
3. Identify tasks with today's due date → must include
4. Match tasks to energy patterns:
   - Morning (high energy): Deep work, complex tasks
   - Afternoon (medium): Meetings, collaborative work
   - Evening (low): Admin, quick wins
5. Limit to 3-5 Most Important Tasks (MITs)
6. Include buffer time for unexpected items

## Output Format
"Here's your plan for today:

**Must Do**
- [ ] [Urgent/due today task]

**Focus Time** (when you have energy)
- [ ] [High-priority deep work]

**Quick Wins** (low energy moments)
- [ ] [Easy task 1]
- [ ] [Easy task 2]

Does this look right?"
`,
    };

    for (const [filename, content] of Object.entries(defaultSkills)) {
      const exists = await this.storage.exists(`skills/${filename}`);
      if (!exists) {
        await this.storage.writeFile(`skills/${filename}`, content);
      }
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
