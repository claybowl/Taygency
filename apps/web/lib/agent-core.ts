import OpenAI from "openai";
import type {
  AgentRequest,
  AgentResponse,
  AgentAction,
  Channel,
  AgentExecutionTrace,
} from "@vibe-planning/shared";
import { CLAUDE_CONFIG } from "@vibe-planning/shared";
import { WorkspaceManager } from "./workspace";
import { TaskManager } from "./tasks";
import { ToolExecutor } from "./tools";
import { SkillExecutor } from "./skills";
import { getOpenRouterModel } from "./openrouter";
import { AgentLogger } from "./agent-logger";
import {
  isGraphitiEnabled,
  enrichWithGraphiti,
  formatContextForPrompt,
  storeInteraction,
  type EnrichedContext,
} from "./graphiti";

let agentInstance: AgentCore | null = null;

export class AgentCore {
  private workspace: WorkspaceManager;
  private tasks: TaskManager;
  private tools: ToolExecutor;
  private skills: SkillExecutor;
  private client: OpenAI;

  constructor() {
    this.workspace = WorkspaceManager.getInstance();
    this.tasks = new TaskManager(this.workspace);
    this.tools = new ToolExecutor(this.workspace);
    this.skills = new SkillExecutor(this.workspace);
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
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

  private convertToolToOpenAI(tool: {
    name: string;
    description?: string;
    input_schema: Record<string, unknown>;
  }): OpenAI.Chat.ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.input_schema as unknown as Record<string, unknown>,
      },
    };
  }

  async process(
    request: AgentRequest,
  ): Promise<{ response: AgentResponse; trace: AgentExecutionTrace }> {
    const logger = new AgentLogger();
    const startTime = Date.now();

    logger.info({
      type: "request_received",
      channel: request.channel,
      messagePreview: request.message.slice(0, 100),
    });

    const workspaceExists = await this.workspace.exists();
    logger.debug({
      type: "workspace_check",
      exists: workspaceExists,
      initialized: false,
    });

    if (!workspaceExists) {
      await this.workspace.initialize();
      logger.info({
        type: "workspace_check",
        exists: true,
        initialized: true,
      });
    }

    const workspaceContext = await this.buildContext();
    const activeTasks = await this.tasks.listTasks("active");

    let hasPreferences = false;
    try {
      await this.workspace.readFile("context/preferences.md");
      hasPreferences = true;
    } catch {
      hasPreferences = false;
    }

    logger.info({
      type: "context_built",
      taskCount: activeTasks.length,
      hasPreferences,
    });

    let graphitiContext: EnrichedContext | null = null;
    if (isGraphitiEnabled()) {
      try {
        graphitiContext = await enrichWithGraphiti(
          request.message,
          "default-user",
          {
            numResults: 10,
            includePatterns: true,
            includePreferences: true,
          },
        );
        logger.debug({
          type: "context_built",
          taskCount: graphitiContext.facts.length,
          hasPreferences: graphitiContext.preferences.length > 0,
        });
      } catch (error) {
        logger.warn({
          type: "error",
          message: `Graphiti enrichment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    const availableSkills = await this.skills.listSkills();
    const userSkills = availableSkills.filter(
      (s) => !s.name.startsWith("_meta/"),
    );
    const metaSkills = availableSkills.filter((s) =>
      s.name.startsWith("_meta/"),
    );

    logger.info({
      type: "skills_loaded",
      count: userSkills.length,
      metaSkillCount: metaSkills.length,
    });

    const systemPrompt = this.buildSystemPrompt(
      workspaceContext,
      availableSkills,
      request.channel,
      graphitiContext,
    );

    logger.debug({
      type: "system_prompt_built",
      tokenEstimate: Math.ceil(systemPrompt.length / 4),
    });

    const anthropicTools = this.tools.getToolDefinitions();
    const openaiTools = anthropicTools.map((t) => this.convertToolToOpenAI(t));

    const actions: AgentAction[] = [];
    let totalTokens = 0;
    const skillsExecuted: string[] = [];

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "user",
        content: `[Channel: ${request.channel}]\n\n${request.message}`,
      },
    ];

    const model = getOpenRouterModel();
    logger.info({
      type: "llm_request_start",
      model,
      messageCount: messages.length + 1,
    });

    let response = await this.client.chat.completions.create({
      model,
      max_completion_tokens: CLAUDE_CONFIG.maxTokens,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools: openaiTools,
    });

    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    totalTokens += promptTokens + completionTokens;

    logger.info({
      type: "llm_request_complete",
      promptTokens,
      completionTokens,
      finishReason: response.choices[0]?.finish_reason || "unknown",
    });

    let choice = response.choices[0];
    let iterationNumber = 1;

    while (choice.finish_reason === "tool_calls") {
      const toolCalls = choice.message.tool_calls || [];

      logger.debug({
        type: "iteration_complete",
        iterationNumber,
        hasMoreToolCalls: toolCalls.length > 0,
      });

      const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];

      for (const toolCall of toolCalls) {
        const functionCall = (
          toolCall as unknown as {
            function: { name: string; arguments: string };
          }
        ).function;

        const parsedArgs = JSON.parse(functionCall.arguments);

        logger.info({
          type: "tool_call_start",
          toolName: functionCall.name,
          args: parsedArgs,
        });

        try {
          const result = await this.tools.execute(
            functionCall.name,
            parsedArgs,
          );
          actions.push(result.action);

          if (result.action.type === "skill_executed") {
            skillsExecuted.push(result.action.skill);
            logger.info({
              type: "skill_execution_complete",
              skillName: result.action.skill,
              success: true,
            });
          }

          const resultStr = JSON.stringify(result.result);
          logger.info({
            type: "tool_call_complete",
            toolName: functionCall.name,
            success: true,
            resultPreview: resultStr.slice(0, 200),
          });

          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultStr,
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";

          logger.error({
            type: "tool_call_error",
            toolName: functionCall.name,
            error: errorMsg,
          });

          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Error: ${errorMsg}`,
          });
        }
      }

      messages.push(
        choice.message as OpenAI.Chat.ChatCompletionAssistantMessageParam,
      );
      messages.push(...toolResults);

      logger.info({
        type: "llm_request_start",
        model,
        messageCount: messages.length + 1,
      });

      response = await this.client.chat.completions.create({
        model,
        max_completion_tokens: CLAUDE_CONFIG.maxTokens,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools: openaiTools,
      });

      const iterPromptTokens = response.usage?.prompt_tokens || 0;
      const iterCompletionTokens = response.usage?.completion_tokens || 0;
      totalTokens += iterPromptTokens + iterCompletionTokens;

      logger.info({
        type: "llm_request_complete",
        promptTokens: iterPromptTokens,
        completionTokens: iterCompletionTokens,
        finishReason: response.choices[0]?.finish_reason || "unknown",
      });

      choice = response.choices[0];
      iterationNumber++;

      if (
        choice.finish_reason === "stop" ||
        choice.finish_reason === "length"
      ) {
        break;
      }
    }

    const finalMessage = choice.message.content || "Done!";

    logger.info({
      type: "response_generated",
      messageLength: finalMessage.length,
      actionCount: actions.length,
    });

    const agentResponse: AgentResponse = {
      success: true,
      message: finalMessage,
      actions,
      metadata: {
        tokensUsed: totalTokens,
        processingTimeMs: Date.now() - startTime,
        skillsExecuted,
      },
    };

    if (isGraphitiEnabled()) {
      storeInteraction(
        "default-user",
        request.channel,
        request.message,
        finalMessage,
        {
          skillsExecuted,
          tasksCreated: actions
            .filter((a) => a.type === "task_created")
            .map((a) => (a as { taskId: string }).taskId),
          tasksCompleted: actions
            .filter((a) => a.type === "task_completed")
            .map((a) => (a as { taskId: string }).taskId),
        },
      ).catch((error) => {
        logger.warn({
          type: "error",
          message: `Graphiti storage failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      });
    }

    return {
      response: agentResponse,
      trace: logger.getTrace(),
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
    graphitiContext?: EnrichedContext | null,
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
${graphitiContext ? `\n## Knowledge Graph Context\n${formatContextForPrompt(graphitiContext)}` : ""}

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
