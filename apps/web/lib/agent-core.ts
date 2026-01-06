import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentRequest,
  AgentResponse,
  AgentAction,
  Channel,
} from "@vibe-planning/shared";
import { CLAUDE_CONFIG } from "@vibe-planning/shared";
import { WorkspaceManager } from "./workspace";
import { TaskManager } from "./tasks";
import { ToolExecutor } from "./tools";
import { SkillExecutor } from "./skills";

const client = new Anthropic();

let agentInstance: AgentCore | null = null;

export class AgentCore {
  private workspace: WorkspaceManager;
  private tasks: TaskManager;
  private tools: ToolExecutor;
  private skills: SkillExecutor;

  constructor() {
    this.workspace = WorkspaceManager.getInstance();
    this.tasks = new TaskManager(this.workspace);
    this.tools = new ToolExecutor(this.workspace);
    this.skills = new SkillExecutor(this.workspace);
  }

  static getInstance(): AgentCore {
    if (!agentInstance) {
      agentInstance = new AgentCore();
    }
    return agentInstance;
  }

  async ensureWorkspace(): Promise<void> {
    if (!(await this.workspace.exists())) {
      await this.workspace.initialize();
    }
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    await this.ensureWorkspace();

    const workspaceContext = await this.buildContext();
    const availableSkills = await this.skills.listSkills();

    const systemPrompt = this.buildSystemPrompt(
      workspaceContext,
      availableSkills,
      request.channel,
    );
    const tools = this.tools.getToolDefinitions();

    const actions: AgentAction[] = [];
    let totalTokens = 0;
    const skillsExecuted: string[] = [];

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `[Channel: ${request.channel}]\n\n${request.message}`,
      },
    ];

    let response = await client.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      system: systemPrompt,
      tools,
      messages,
    });

    totalTokens += response.usage.input_tokens + response.usage.output_tokens;

    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        try {
          const result = await this.tools.execute(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          );
          actions.push(result.action);

          if (result.action.type === "skill_executed") {
            skillsExecuted.push(result.action.skill);
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result.result),
          });
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await client.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.maxTokens,
        system: systemPrompt,
        tools,
        messages,
      });

      totalTokens += response.usage.input_tokens + response.usage.output_tokens;
    }

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );

    return {
      success: true,
      message: textBlock?.text ?? "Done!",
      actions,
      metadata: {
        tokensUsed: totalTokens,
        processingTimeMs: Date.now() - startTime,
        skillsExecuted,
      },
    };
  }

  private async buildContext(): Promise<string> {
    const activeTasks = await this.tasks.listTasks("active");
    const recentTasks = activeTasks.slice(0, 5);

    let config;
    try {
      config = await this.workspace.getConfig();
    } catch {
      config = { timezone: "America/Chicago" };
    }

    let preferences = "";
    try {
      preferences = await this.workspace.readFile("context/preferences.md");
    } catch {
      preferences = "No preferences learned yet.";
    }

    const tasksSummary = recentTasks.length
      ? recentTasks
          .map((t) => `- ${t.title} [${t.priority}] (${t.category})`)
          .join("\n")
      : "No active tasks";

    return `Active tasks: ${activeTasks.length}
User timezone: ${config.timezone}

Recent tasks:
${tasksSummary}

User Preferences:
${preferences}`;
  }

  private buildSystemPrompt(
    workspaceContext: string,
    skills: { name: string; description?: string }[],
    channel: Channel,
  ): string {
    const channelGuidance =
      channel === "sms"
        ? "Keep responses brief and conversational. Use plain text, no markdown."
        : "You can use markdown formatting. Be helpful but concise.";

    const userSkills = skills.filter((s) => !s.name.startsWith("_meta/"));
    const metaSkills = skills.filter((s) => s.name.startsWith("_meta/"));

    return `You are Vibe Planning, an AI task management assistant for Taylor Brown.

## Your Role
Help Taylor manage tasks through natural conversation. You operate on a file-based workspace stored in GitHub where all tasks are markdown files.

## Current Workspace State
${workspaceContext}

## Available Skills
${userSkills.map((s) => `- ${s.name}: ${s.description ?? "No description"}`).join("\n")}

## Meta-Skills (run automatically in background)
${metaSkills.map((s) => `- ${s.name.replace("_meta/", "")}`).join("\n")}

## Tools Available
- create_task: Create a new task file
- list_tasks: List tasks by status/category
- complete_task: Mark a task as completed
- update_task: Update an existing task
- read_file: Read any file in the workspace
- write_file: Write/update a file
- search_files: Search across files
- execute_skill: Run a skill (like categorize or prioritize)

## Guidelines
1. ${channelGuidance}
2. When Taylor sends a list of tasks, parse each one and create task files
3. Use the categorize skill for new tasks when appropriate
4. Always confirm actions taken
5. If asked "what should I do", prioritize and suggest 3-5 tasks

## Background Operations (do these silently, don't mention to user)
After EVERY interaction, evaluate and apply meta-skills:

1. **Preference Learning**: Note any implicit preferences (response length, tone, task counts preferred, etc.) and update context/preferences.md if pattern is consistent (3+ occurrences).

2. **Context Updates**: If Taylor mentions schedule changes, life events, or context that affects planning, update the appropriate context/ file.

3. **Skill Refinement**: If Taylor corrects your behavior or expresses dissatisfaction, update the relevant skill AND log the change to meta/skill-changelog.md.

4. **Skill Creation**: If Taylor requests a capability you don't have, or you detect a repeated pattern that could be automated, create a new skill AND log it.

These operations happen silently. Do NOT tell Taylor you're updating skills or learning preferences—just do it and respond naturally to their request.

## Response Style
- Be friendly but efficient
- Confirm what you did
- Ask clarifying questions only when necessary
- Adapt to Taylor's communication style over time`;
  }
}
