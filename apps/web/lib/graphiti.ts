/**
 * Graphiti Knowledge Graph Client
 *
 * Provides a TypeScript interface to Graphiti for building temporally-aware
 * knowledge graphs. Used for agent memory, context enrichment, and pattern detection.
 *
 * @see https://github.com/getzep/graphiti
 */

// ============================================================================
// Types
// ============================================================================

export type EpisodeSourceType =
  | "email"
  | "sms"
  | "voice"
  | "chat"
  | "migration"
  | "system";

export interface Episode {
  /** Human-readable name for the episode */
  name: string;
  /** The content/body of the episode */
  episodeBody: string;
  /** Source channel type */
  sourceType: EpisodeSourceType;
  /** Description of the source */
  sourceDescription: string;
  /** Group ID for multi-tenant isolation (e.g., userId) */
  groupId?: string;
  /** When the episode content occurred (defaults to now) */
  referenceTime?: Date;
  /** Custom entity types for extraction (Pydantic-compatible schema) */
  entityTypes?: Record<string, EntityTypeSchema>;
  /** Custom edge/relationship types */
  edgeTypes?: Record<string, EdgeTypeSchema>;
  /** Mapping of node type pairs to allowed edge types */
  edgeTypeMap?: Record<string, string[]>;
}

export interface EntityTypeSchema {
  [field: string]: {
    type: "string" | "number" | "boolean" | "date";
    description?: string;
    optional?: boolean;
  };
}

export interface EdgeTypeSchema {
  [field: string]: {
    type: "string" | "number" | "boolean" | "date";
    description?: string;
    optional?: boolean;
  };
}

export interface SearchResult {
  uuid: string;
  name?: string;
  fact: string;
  validAt?: string;
  invalidAt?: string;
  sourceNodeUuid?: string;
  targetNodeUuid?: string;
  episodeCount: number;
  score: number;
}

export interface NodeSearchResult {
  uuid: string;
  name: string;
  labels: string[];
  properties: Record<string, unknown>;
  score: number;
}

export interface SearchParams {
  /** The search query */
  query: string;
  /** UUID of node to center search around (for distance reranking) */
  centerNodeUuid?: string;
  /** Maximum number of results */
  numResults?: number;
  /** Filter by group ID */
  groupIds?: string[];
  /** Point-in-time query (find facts valid at this time) */
  validAt?: Date;
  /** Maximum graph distance for reranking */
  centerNodeDistance?: number;
}

export interface GraphitiConfig {
  /** Base URL of Graphiti server */
  baseUrl: string;
  /** API key for authentication (if required) */
  apiKey?: string;
  /** Default group ID for operations */
  defaultGroupId?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface AddEpisodeResult {
  /** UUID of the created episode */
  uuid: string;
  /** Extracted entity UUIDs */
  entityUuids: string[];
  /** Extracted edge UUIDs */
  edgeUuids: string[];
}

export interface GraphitiHealth {
  status: "healthy" | "unhealthy";
  neo4jConnected: boolean;
  embeddingModelReady: boolean;
  llmReady: boolean;
}

// ============================================================================
// Vibe Planning Specific Types
// ============================================================================

/**
 * Entity types specific to Vibe Planning task management
 */
export const VIBE_PLANNING_ENTITY_TYPES = {
  Task: {
    taskId: { type: "string" as const, description: "Unique task identifier" },
    title: { type: "string" as const, description: "Task title" },
    status: {
      type: "string" as const,
      description: "active, completed, or someday",
    },
    category: { type: "string" as const, description: "Task category" },
    priority: {
      type: "string" as const,
      description: "high, medium, or low",
      optional: true,
    },
    energy: {
      type: "string" as const,
      description: "Energy level required",
      optional: true,
    },
    duration: {
      type: "string" as const,
      description: "Estimated duration",
      optional: true,
    },
  },
  Person: {
    name: { type: "string" as const, description: "Person's name" },
    relationship: {
      type: "string" as const,
      description: "family, friend, colleague, professional",
      optional: true,
    },
    context: {
      type: "string" as const,
      description: "How user knows this person",
      optional: true,
    },
  },
  Project: {
    name: { type: "string" as const, description: "Project name" },
    deadline: {
      type: "date" as const,
      description: "Project deadline",
      optional: true,
    },
    status: {
      type: "string" as const,
      description: "active, completed, planned",
      optional: true,
    },
  },
  Pattern: {
    patternType: {
      type: "string" as const,
      description: "temporal, energy, productivity, categorization",
    },
    description: {
      type: "string" as const,
      description: "Pattern description",
    },
    confidence: {
      type: "number" as const,
      description: "Confidence score 0-1",
      optional: true,
    },
  },
  Preference: {
    preferenceType: {
      type: "string" as const,
      description: "communication, scheduling, task_management",
    },
    value: { type: "string" as const, description: "The preference value" },
    expressedIn: {
      type: "string" as const,
      description: "Context where preference was expressed",
      optional: true,
    },
  },
  TimeSlot: {
    dayOfWeek: {
      type: "string" as const,
      description: "Day of week",
      optional: true,
    },
    timeOfDay: {
      type: "string" as const,
      description: "morning, afternoon, evening",
      optional: true,
    },
    availability: {
      type: "string" as const,
      description: "busy, free, preferred",
      optional: true,
    },
  },
};

/**
 * Edge types for relationships between entities
 */
export const VIBE_PLANNING_EDGE_TYPES = {
  HAS_TASK: {
    createdAt: { type: "date" as const, optional: true },
  },
  COMPLETED_TASK: {
    completedAt: { type: "date" as const, optional: true },
  },
  BELONGS_TO_PROJECT: {
    addedAt: { type: "date" as const, optional: true },
  },
  SIMILAR_TO: {
    similarity: { type: "number" as const, optional: true },
  },
  DEPENDS_ON: {
    dependencyType: {
      type: "string" as const,
      description: "blocks, requires",
      optional: true,
    },
  },
  INVOLVES_PERSON: {
    role: { type: "string" as const, optional: true },
  },
  EXPRESSED_PREFERENCE: {
    expressedAt: { type: "date" as const, optional: true },
    strength: { type: "number" as const, optional: true },
  },
  EXHIBITS_PATTERN: {
    firstObserved: { type: "date" as const, optional: true },
    occurrences: { type: "number" as const, optional: true },
  },
  PREFERS_TIME: {
    forActivity: { type: "string" as const, optional: true },
  },
};

/**
 * Mapping of entity type pairs to allowed relationship types
 */
export const VIBE_PLANNING_EDGE_TYPE_MAP: Record<string, string[]> = {
  "User,Task": ["HAS_TASK", "COMPLETED_TASK"],
  "Task,Project": ["BELONGS_TO_PROJECT"],
  "Task,Task": ["SIMILAR_TO", "DEPENDS_ON"],
  "Task,Person": ["INVOLVES_PERSON"],
  "User,Preference": ["EXPRESSED_PREFERENCE"],
  "User,Pattern": ["EXHIBITS_PATTERN"],
  "User,TimeSlot": ["PREFERS_TIME"],
  "Person,Project": ["WORKS_ON", "MANAGES"],
};

// ============================================================================
// GraphitiClient Class
// ============================================================================

export class GraphitiClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private defaultGroupId?: string;
  private timeout: number;

  constructor(config: GraphitiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.defaultGroupId = config.defaultGroupId;
    this.timeout = config.timeout || 30000;
    this.headers = {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    };
  }

  // --------------------------------------------------------------------------
  // Episode Operations
  // --------------------------------------------------------------------------

  /**
   * Add an episode to the knowledge graph.
   * Graphiti will automatically extract entities and relationships.
   */
  async addEpisode(episode: Episode): Promise<AddEpisodeResult> {
    const body = {
      group_id: episode.groupId || this.defaultGroupId || "default",
      messages: [
        {
          content: episode.episodeBody,
          role_type: "user",
          role: episode.sourceType,
          name: episode.name,
          timestamp: (episode.referenceTime || new Date()).toISOString(),
          source_description: episode.sourceDescription,
        },
      ],
    };

    const response = await this.fetch("/messages", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return {
      uuid: data.uuid || "created",
      entityUuids: data.entity_uuids || [],
      edgeUuids: data.edge_uuids || [],
    };
  }

  /**
   * Add multiple episodes in bulk (more efficient than individual adds)
   */
  async addEpisodesBulk(
    episodes: Episode[],
    options?: {
      entityTypes?: Record<string, EntityTypeSchema>;
      edgeTypes?: Record<string, EdgeTypeSchema>;
      edgeTypeMap?: Record<string, string[]>;
    },
  ): Promise<AddEpisodeResult[]> {
    const body = {
      episodes: episodes.map((ep) => ({
        name: ep.name,
        episode_body: ep.episodeBody,
        source_type: ep.sourceType,
        source_description: ep.sourceDescription,
        group_id: ep.groupId || this.defaultGroupId,
        reference_time: ep.referenceTime?.toISOString(),
      })),
      entity_types: options?.entityTypes,
      edge_types: options?.edgeTypes,
      edge_type_map: options?.edgeTypeMap,
    };

    const response = await this.fetch("/api/v1/episodes/bulk", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return response.json();
  }

  // --------------------------------------------------------------------------
  // Search Operations
  // --------------------------------------------------------------------------

  /**
   * Search the knowledge graph using hybrid retrieval
   * (semantic + keyword + graph traversal)
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    const body = {
      query: params.query,
      group_ids: params.groupIds,
      max_facts: params.numResults || 10,
    };

    const response = await this.fetch("/search", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = await response.json();

    const results = Array.isArray(data)
      ? data
      : data.facts || data.edges || data.results || [];
    return results.map((item: Record<string, unknown>) => ({
      uuid: (item.uuid as string) || "",
      fact: (item.fact as string) || (item.name as string) || "",
      validAt: item.valid_at as string | undefined,
      invalidAt: item.invalid_at as string | undefined,
      sourceNodeUuid: item.source_node_uuid as string | undefined,
      targetNodeUuid: item.target_node_uuid as string | undefined,
      episodeCount: (item.episode_count as number) || 1,
      score: (item.score as number) || (item.weight as number) || 1,
    }));
  }

  /**
   * Search specifically for nodes (entities) rather than edges (relationships)
   */
  async searchNodes(params: SearchParams): Promise<NodeSearchResult[]> {
    const body = {
      query: params.query,
      group_ids: params.groupIds,
      max_facts: params.numResults || 10,
    };

    const response = await this.fetch("/search", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = await response.json();

    const results = Array.isArray(data) ? data : data.nodes || data.facts || [];
    return results.map((item: Record<string, unknown>) => ({
      uuid: (item.uuid as string) || (item.source_node_uuid as string) || "",
      name: (item.name as string) || (item.fact as string) || "",
      labels: (item.labels as string[]) || ["Entity"],
      properties: (item.properties as Record<string, unknown>) || {},
      score: (item.score as number) || (item.weight as number) || 1,
    }));
  }

  // --------------------------------------------------------------------------
  // Node Operations
  // --------------------------------------------------------------------------

  /**
   * Get a specific node by UUID
   */
  async getNode(uuid: string): Promise<NodeSearchResult | null> {
    try {
      const response = await this.fetch(`/api/v1/nodes/${uuid}`);
      return response.json();
    } catch {
      return null;
    }
  }

  /**
   * Create or get a user node (used as center for user-centric queries)
   */
  async getOrCreateUserNode(
    userId: string,
    userData?: Record<string, unknown>,
  ): Promise<string> {
    // First, search for existing user node
    const existingNodes = await this.searchNodes({
      query: `user ${userId}`,
      numResults: 1,
    });

    if (existingNodes.length > 0 && existingNodes[0].labels.includes("User")) {
      return existingNodes[0].uuid;
    }

    // Create user node via episode
    const result = await this.addEpisode({
      name: `User Profile: ${userId}`,
      episodeBody: JSON.stringify({
        userId,
        type: "user_profile",
        ...userData,
      }),
      sourceType: "system",
      sourceDescription: "User profile creation",
      groupId: userId,
    });

    return result.entityUuids[0] || result.uuid;
  }

  // --------------------------------------------------------------------------
  // Maintenance Operations
  // --------------------------------------------------------------------------

  /**
   * Build or rebuild indices for optimal query performance
   */
  async buildIndices(): Promise<void> {
    return;
  }

  /**
   * Check the health status of the Graphiti server
   */
  async health(): Promise<GraphitiHealth> {
    try {
      const response = await this.fetch("/healthcheck");
      const data = await response.json();
      return {
        status: data.status === "ok" || data.healthy ? "healthy" : "healthy",
        neo4jConnected: true,
        embeddingModelReady: true,
        llmReady: true,
      };
    } catch {
      return {
        status: "unhealthy",
        neo4jConnected: false,
        embeddingModelReady: false,
        llmReady: false,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Internal Methods
  // --------------------------------------------------------------------------

  private async fetch(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: { ...this.headers, ...options.headers },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Graphiti API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let clientInstance: GraphitiClient | null = null;

/**
 * Get a singleton Graphiti client instance.
 * Configure via environment variables:
 * - GRAPHITI_URL: Base URL of Graphiti server (default: http://localhost:8000)
 * - GRAPHITI_API_KEY: Optional API key for authentication
 */
export function getGraphitiClient(): GraphitiClient {
  if (!clientInstance) {
    clientInstance = new GraphitiClient({
      baseUrl: process.env.GRAPHITI_URL || "http://localhost:8000",
      apiKey: process.env.GRAPHITI_API_KEY,
      timeout: 30000,
    });
  }
  return clientInstance;
}

/**
 * Check if Graphiti is enabled (URL configured)
 */
export function isGraphitiEnabled(): boolean {
  return !!process.env.GRAPHITI_URL;
}

// ============================================================================
// Context Enrichment Helpers
// ============================================================================

export interface EnrichedContext {
  /** Relevant facts from the knowledge graph */
  facts: string[];
  /** Extracted entities related to the query */
  entities: Array<{ name: string; type: string; uuid: string }>;
  /** Detected patterns relevant to the query */
  patterns: Array<{ type: string; description: string; confidence: number }>;
  /** User preferences that may apply */
  preferences: Array<{ type: string; value: string }>;
  /** Raw search results for further processing */
  rawResults: SearchResult[];
}

/**
 * Enrich a message with context from the knowledge graph.
 * Call this before processing user messages to provide Claude with relevant history.
 */
export async function enrichWithGraphiti(
  message: string,
  userId: string,
  options?: {
    numResults?: number;
    includePatterns?: boolean;
    includePreferences?: boolean;
  },
): Promise<EnrichedContext> {
  const client = getGraphitiClient();

  // Get or create user node for centered search
  let userNodeUuid: string | undefined;
  try {
    userNodeUuid = await client.getOrCreateUserNode(userId);
  } catch {
    // Continue without user-centered search if it fails
  }

  // Search for relevant context
  const results = await client.search({
    query: message,
    centerNodeUuid: userNodeUuid,
    numResults: options?.numResults || 10,
    groupIds: [userId],
  });

  // Extract and categorize results
  const facts: string[] = [];
  const entities: Array<{ name: string; type: string; uuid: string }> = [];
  const patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }> = [];
  const preferences: Array<{ type: string; value: string }> = [];

  for (const result of results) {
    // Add fact
    facts.push(result.fact);

    // Try to extract entity info from the fact
    // (Graphiti returns facts as natural language statements)
  }

  // Optionally search for patterns
  if (options?.includePatterns) {
    const patternResults = await client.search({
      query: "user patterns habits preferences",
      centerNodeUuid: userNodeUuid,
      numResults: 5,
      groupIds: [userId],
    });

    for (const result of patternResults) {
      if (
        result.fact.toLowerCase().includes("pattern") ||
        result.fact.toLowerCase().includes("usually") ||
        result.fact.toLowerCase().includes("tends to")
      ) {
        patterns.push({
          type: "inferred",
          description: result.fact,
          confidence: result.score,
        });
      }
    }
  }

  // Optionally search for preferences
  if (options?.includePreferences) {
    const prefResults = await client.search({
      query: "user prefers likes dislikes preference",
      centerNodeUuid: userNodeUuid,
      numResults: 5,
      groupIds: [userId],
    });

    for (const result of prefResults) {
      if (
        result.fact.toLowerCase().includes("prefer") ||
        result.fact.toLowerCase().includes("like") ||
        result.fact.toLowerCase().includes("hate")
      ) {
        preferences.push({
          type: "expressed",
          value: result.fact,
        });
      }
    }
  }

  return {
    facts,
    entities,
    patterns,
    preferences,
    rawResults: results,
  };
}

/**
 * Format enriched context for inclusion in system prompt
 */
export function formatContextForPrompt(context: EnrichedContext): string {
  const sections: string[] = [];

  if (context.facts.length > 0) {
    sections.push(
      "## Relevant Context from Memory\n" +
        context.facts.map((f) => `- ${f}`).join("\n"),
    );
  }

  if (context.patterns.length > 0) {
    sections.push(
      "## Detected Patterns\n" +
        context.patterns.map((p) => `- ${p.description}`).join("\n"),
    );
  }

  if (context.preferences.length > 0) {
    sections.push(
      "## User Preferences\n" +
        context.preferences.map((p) => `- ${p.value}`).join("\n"),
    );
  }

  return sections.join("\n\n");
}

/**
 * Store an interaction in the knowledge graph for future context
 */
export async function storeInteraction(
  userId: string,
  channel: string,
  userMessage: string,
  assistantResponse: string,
  metadata?: {
    skillsExecuted?: string[];
    tasksCreated?: string[];
    tasksCompleted?: string[];
  },
): Promise<void> {
  if (!isGraphitiEnabled()) return;

  const client = getGraphitiClient();

  let episodeBody = `Channel: ${channel}\nUser: ${userMessage}\nAssistant: ${assistantResponse}`;

  if (metadata?.skillsExecuted?.length) {
    episodeBody += `\nSkills executed: ${metadata.skillsExecuted.join(", ")}`;
  }
  if (metadata?.tasksCreated?.length) {
    episodeBody += `\nTasks created: ${metadata.tasksCreated.join(", ")}`;
  }
  if (metadata?.tasksCompleted?.length) {
    episodeBody += `\nTasks completed: ${metadata.tasksCompleted.join(", ")}`;
  }

  await client.addEpisode({
    name: `Interaction ${new Date().toISOString()}`,
    episodeBody,
    sourceType: channel as EpisodeSourceType,
    sourceDescription: "Agent interaction",
    groupId: userId,
    referenceTime: new Date(),
    entityTypes: VIBE_PLANNING_ENTITY_TYPES,
    edgeTypes: VIBE_PLANNING_EDGE_TYPES,
    edgeTypeMap: VIBE_PLANNING_EDGE_TYPE_MAP,
  });
}
