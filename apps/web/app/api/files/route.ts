import { NextRequest, NextResponse } from "next/server";
import { getGitHubStorage } from "@/lib/github-storage";

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
}

export interface FilesApiResponse {
  tree: FileTreeNode[];
  error?: string;
}

async function buildFileTree(
  storage: ReturnType<typeof getGitHubStorage>,
  path: string,
  depth: number = 0,
  maxDepth: number = 3,
): Promise<FileTreeNode[]> {
  if (depth >= maxDepth) return [];

  const nodes: FileTreeNode[] = [];

  try {
    const files = await storage.listDirectory(path);
    const dirs = await storage.listSubdirectories(path);

    for (const dir of dirs.sort()) {
      const dirPath = path ? `${path}/${dir}` : dir;
      const children = await buildFileTree(
        storage,
        dirPath,
        depth + 1,
        maxDepth,
      );
      nodes.push({
        name: dir,
        path: dirPath,
        type: "dir",
        children,
      });
    }

    for (const file of files.sort()) {
      if (file === ".gitkeep") continue;
      nodes.push({
        name: file,
        path: path ? `${path}/${file}` : file,
        type: "file",
      });
    }
  } catch (err) {
    console.warn(`[Files API] Error reading ${path}:`, err);
  }

  return nodes;
}

export async function GET(request: NextRequest) {
  try {
    const storage = getGitHubStorage();
    const tree = await buildFileTree(storage, "", 0, 3);

    const response: FilesApiResponse = { tree };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /files] Error:", error);
    return NextResponse.json(
      { tree: [], error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}
