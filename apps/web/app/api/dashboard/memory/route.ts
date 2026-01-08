import { NextResponse } from "next/server";
import {
  isGraphitiEnabled,
  getGraphitiClient,
  type SearchResult,
} from "@/lib/graphiti";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  fact: string;
  validAt?: string;
  invalidAt?: string;
}

export interface MemoryStats {
  totalFacts: number;
  totalEntities: number;
  recentFacts: number;
  patterns: number;
  preferences: number;
}

export interface MemoryResponse {
  enabled: boolean;
  healthy: boolean;
  stats: MemoryStats;
  recentFacts: Array<{
    fact: string;
    validAt?: string;
    score: number;
  }>;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

// Entity type detection based on keywords and patterns
type EntityType = "Person" | "Task" | "Project" | "Pattern" | "Preference";

interface ExtractedEntity {
  id: string;
  label: string;
  type: EntityType;
}

interface ParsedFact {
  subject: ExtractedEntity;
  object: ExtractedEntity;
  relationship: string;
  originalFact: string;
  factId: string;
}

// Keywords for entity type classification
const PERSON_INDICATORS = [
  "user",
  "they",
  "he",
  "she",
  "person",
  "client",
  "customer",
  "team",
  "manager",
  "assistant",
  "owner",
  "member",
  "contact",
];
const TASK_INDICATORS = [
  "task",
  "meeting",
  "call",
  "email",
  "report",
  "deadline",
  "review",
  "schedule",
  "appointment",
  "work",
  "project",
  "presentation",
];
const PROJECT_INDICATORS = [
  "project",
  "initiative",
  "campaign",
  "program",
  "launch",
  "release",
  "sprint",
  "quarter",
  "q1",
  "q2",
  "q3",
  "q4",
];
const PATTERN_INDICATORS = [
  "usually",
  "always",
  "often",
  "tends",
  "habit",
  "routine",
  "typically",
  "regularly",
  "every",
  "daily",
  "weekly",
];
const PREFERENCE_INDICATORS = [
  "prefer",
  "like",
  "love",
  "enjoy",
  "favorite",
  "dislike",
  "hate",
  "avoid",
  "want",
  "need",
];

// Relationship keywords that help identify subject vs object
const RELATIONSHIP_VERBS = [
  "handles",
  "manages",
  "prefers",
  "likes",
  "works",
  "schedules",
  "attends",
  "owns",
  "leads",
  "creates",
  "has",
  "is",
  "wants",
  "needs",
  "uses",
  "sends",
  "receives",
];

function normalizeId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function classifyEntityType(text: string, isSubject: boolean): EntityType {
  const lower = text.toLowerCase();

  // Check for specific indicators
  if (PERSON_INDICATORS.some((p) => lower.includes(p))) return "Person";
  if (PREFERENCE_INDICATORS.some((p) => lower.includes(p))) return "Preference";
  if (PATTERN_INDICATORS.some((p) => lower.includes(p))) return "Pattern";
  if (PROJECT_INDICATORS.some((p) => lower.includes(p))) return "Project";
  if (TASK_INDICATORS.some((p) => lower.includes(p))) return "Task";

  // Default: subjects are usually People, objects are usually Tasks
  return isSubject ? "Person" : "Task";
}

function extractEntitiesFromFact(
  fact: string,
  factId: string,
  relationshipName?: string,
): ParsedFact | null {
  // Clean up the fact text
  const cleanFact = fact.trim();
  if (!cleanFact || cleanFact.length < 5) return null;

  // Try to split by common relationship patterns
  let subject = "";
  let object = "";
  let relationship = relationshipName || "RELATES_TO";

  // Pattern 1: "X verb Y" (e.g., "Sarah handles the reports")
  for (const verb of RELATIONSHIP_VERBS) {
    const verbPattern = new RegExp(`(.+?)\\s+${verb}s?\\s+(.+)`, "i");
    const match = cleanFact.match(verbPattern);
    if (match) {
      subject = match[1].trim();
      object = match[2].trim();
      relationship = verb.toUpperCase();
      break;
    }
  }

  // Pattern 2: "X is/are Y" pattern
  if (!subject) {
    const isMatch = cleanFact.match(/(.+?)\s+(?:is|are)\s+(.+)/i);
    if (isMatch) {
      subject = isMatch[1].trim();
      object = isMatch[2].trim();
      relationship = "IS";
    }
  }

  // Pattern 3: Just use the whole fact as a single entity if no pattern matches
  if (!subject) {
    // Create a single node from the fact
    const words = cleanFact.split(/\s+/);
    if (words.length >= 2) {
      subject = words.slice(0, Math.ceil(words.length / 2)).join(" ");
      object = words.slice(Math.ceil(words.length / 2)).join(" ");
    } else {
      return null;
    }
  }

  // Clean up extracted parts
  subject = subject.replace(/^(the|a|an)\s+/i, "").trim();
  object = object.replace(/^(the|a|an)\s+/i, "").trim();

  // Create entities with proper types
  const subjectEntity: ExtractedEntity = {
    id: normalizeId(subject),
    label: subject.length > 25 ? subject.slice(0, 25) + "..." : subject,
    type: classifyEntityType(subject, true),
  };

  const objectEntity: ExtractedEntity = {
    id: normalizeId(object),
    label: object.length > 25 ? object.slice(0, 25) + "..." : object,
    type: classifyEntityType(object, false),
  };

  // Use the relationship name from Graphiti if available
  if (relationshipName) {
    relationship = relationshipName;
  }

  return {
    subject: subjectEntity,
    object: objectEntity,
    relationship,
    originalFact: cleanFact,
    factId,
  };
}

export async function GET(): Promise<NextResponse<MemoryResponse>> {
  if (!isGraphitiEnabled()) {
    return NextResponse.json({
      enabled: false,
      healthy: false,
      stats: {
        totalFacts: 0,
        totalEntities: 0,
        recentFacts: 0,
        patterns: 0,
        preferences: 0,
      },
      recentFacts: [],
      graph: { nodes: [], edges: [] },
    });
  }

  const client = getGraphitiClient();

  try {
    const health = await client.health();

    if (health.status !== "healthy") {
      return NextResponse.json({
        enabled: true,
        healthy: false,
        stats: {
          totalFacts: 0,
          totalEntities: 0,
          recentFacts: 0,
          patterns: 0,
          preferences: 0,
        },
        recentFacts: [],
        graph: { nodes: [], edges: [] },
      });
    }

    const [recentResults, patternResults, preferenceResults] =
      await Promise.all([
        client
          .search({ query: "user meeting project task", numResults: 30 })
          .catch(() => [] as SearchResult[]),
        client
          .search({ query: "pattern habit usually tends", numResults: 10 })
          .catch(() => [] as SearchResult[]),
        client
          .search({ query: "prefer like dislike preference", numResults: 10 })
          .catch(() => [] as SearchResult[]),
      ]);

    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    for (const fact of recentResults.slice(0, 25)) {
      const parsed = extractEntitiesFromFact(fact.fact, fact.uuid, fact.name);
      if (!parsed) continue;

      if (!nodeMap.has(parsed.subject.id)) {
        nodeMap.set(parsed.subject.id, {
          id: parsed.subject.id,
          label: parsed.subject.label,
          type: parsed.subject.type,
          properties: { facts: [fact.fact] },
        });
      } else {
        const existing = nodeMap.get(parsed.subject.id)!;
        (existing.properties.facts as string[]).push(fact.fact);
      }

      if (!nodeMap.has(parsed.object.id)) {
        nodeMap.set(parsed.object.id, {
          id: parsed.object.id,
          label: parsed.object.label,
          type: parsed.object.type,
          properties: { facts: [fact.fact] },
        });
      } else {
        const existing = nodeMap.get(parsed.object.id)!;
        (existing.properties.facts as string[]).push(fact.fact);
      }

      edges.push({
        id: `edge-${fact.uuid}`,
        source: parsed.subject.id,
        target: parsed.object.id,
        label: parsed.relationship,
        fact: fact.fact,
        validAt: fact.validAt,
      });
    }

    const nodes = Array.from(nodeMap.values());

    const stats: MemoryStats = {
      totalFacts: recentResults.length,
      totalEntities: nodes.length,
      recentFacts: recentResults.filter((r) => {
        if (!r.validAt) return true;
        const validDate = new Date(r.validAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return validDate > dayAgo;
      }).length,
      patterns: patternResults.length,
      preferences: preferenceResults.length,
    };

    const recentFacts = recentResults.slice(0, 10).map((r) => ({
      fact: r.fact,
      validAt: r.validAt,
      score: r.score,
    }));

    return NextResponse.json({
      enabled: true,
      healthy: true,
      stats,
      recentFacts,
      graph: { nodes, edges },
    });
  } catch (error) {
    console.error("Memory API error:", error);
    return NextResponse.json({
      enabled: true,
      healthy: false,
      stats: {
        totalFacts: 0,
        totalEntities: 0,
        recentFacts: 0,
        patterns: 0,
        preferences: 0,
      },
      recentFacts: [],
      graph: { nodes: [], edges: [] },
    });
  }
}
