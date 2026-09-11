import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { head, put } from "@vercel/blob";
import { env } from "./env";

export const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), "../..", ".uploads");

export type StoredFile = { key: string; url: string };

export async function putObject(
  key: string,
  data: Uint8Array,
  contentType: string,
): Promise<StoredFile> {
  if (env.storageProvider === "vercel") {
    const blob = await put(key, Buffer.from(data), {
      access: "public",
      contentType,
      token: env.blobReadWriteToken || undefined,
    });
    return { key: blob.pathname || key, url: blob.url };
  }
  const target = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return { key, url: `/api/files/${key}` };
}

export async function objectUrl(key: string): Promise<string> {
  if (env.storageProvider === "vercel") {
    const blob = await head(key, { token: env.blobReadWriteToken || undefined });
    return blob.url;
  }
  return `/api/files/${key}`;
}

export function resolveLocalPath(key: string): string | null {
  const target = path.resolve(LOCAL_UPLOAD_DIR, key);
  if (!target.startsWith(`${LOCAL_UPLOAD_DIR}${path.sep}`)) {
    return null;
  }
  return target;
}
