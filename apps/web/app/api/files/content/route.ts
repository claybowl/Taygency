import { NextRequest, NextResponse } from "next/server";
import { getGitHubStorage } from "@/lib/github-storage";

export interface FileContentResponse {
  path: string;
  content: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { path: "", content: "", error: "Path parameter is required" },
      { status: 400 },
    );
  }

  try {
    const storage = getGitHubStorage();
    const content = await storage.readFile(path);

    const response: FileContentResponse = { path, content };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`[API /files/content] Error reading ${path}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to read file";
    return NextResponse.json(
      { path, content: "", error: errorMessage },
      { status: 404 },
    );
  }
}
