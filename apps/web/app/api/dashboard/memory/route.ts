import { NextResponse } from "next/server";
import {
  isGraphitiEnabled,
  getGraphitiClient,
  type SearchResult,
  type NodeSearchResult,
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

    const nodes: GraphNode[] = recentResults.slice(0, 20).map((fact) => ({
      id: fact.uuid,
      label: fact.fact.split(" ").slice(0, 4).join(" ") + "...",
      type: fact.name || "Fact",
      properties: { fullFact: fact.fact },
    }));

    const edges: GraphEdge[] = [];

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
