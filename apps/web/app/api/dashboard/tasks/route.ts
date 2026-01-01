import { NextRequest, NextResponse } from 'next/server';
import type { TasksResponse } from '@vibe-planning/shared';

const FLY_AGENT_URL = process.env.FLY_AGENT_URL!;
const AGENT_SECRET = process.env.AGENT_SECRET!;

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const status = req.nextUrl.searchParams.get('status') ?? 'active';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const response = await fetch(`${FLY_AGENT_URL}/tasks?userId=${userId}&status=${status}`, {
      headers: { Authorization: `Bearer ${AGENT_SECRET}` },
    });

    if (!response.ok) {
      throw new Error(`Agent returned ${response.status}`);
    }

    const data: TasksResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Dashboard Tasks] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
