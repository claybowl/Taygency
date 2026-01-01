import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { DATA_ROOT } from '@vibe-planning/shared';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.R2_BUCKET ?? 'vibe-planning-backups';

export async function backupWorkspace(userId: string): Promise<void> {
  const userPath = path.join(DATA_ROOT, userId);
  const files = await getAllFiles(userPath);

  for (const file of files) {
    const relativePath = file.replace(userPath, '');
    const content = await fs.readFile(file);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${userId}${relativePath}`,
        Body: content,
      })
    );
  }
}

export async function restoreWorkspace(userId: string): Promise<void> {
  const prefix = `${userId}/`;

  const listResponse = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  if (!listResponse.Contents) return;

  for (const object of listResponse.Contents) {
    if (!object.Key) continue;

    const getResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: object.Key,
      })
    );

    if (!getResponse.Body) continue;

    const localPath = path.join(DATA_ROOT, object.Key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });

    const bodyContents = await getResponse.Body.transformToByteArray();
    await fs.writeFile(localPath, bodyContents);
  }
}

export async function exportWorkspace(userId: string): Promise<Buffer> {
  const userPath = path.join(DATA_ROOT, userId);
  const files = await getAllFiles(userPath);

  const archive: Record<string, string> = {};

  for (const file of files) {
    const relativePath = file.replace(userPath, '');
    const content = await fs.readFile(file, 'utf-8');
    archive[relativePath] = content;
  }

  return Buffer.from(JSON.stringify(archive, null, 2));
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...(await getAllFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    return [];
  }

  return files;
}
