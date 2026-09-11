import path from "node:path";
import dotenv from "dotenv";
import { normalizeAppUrl } from "@tmr/core";

dotenv.config({ path: [path.resolve(process.cwd(), "../../.env"), ".env"] });

function provider<T extends string>(
  value: string | undefined,
  fallback: T,
  allowed: readonly T[],
): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export type LlmProviderName = "mock" | "deepseek";
export type EmailProviderName = "console" | "resend" | "brevo";
export type StorageProviderName = "local" | "vercel";

export const env = {
  get databaseUrl(): string {
    return required("DATABASE_URL");
  },
  get authSecret(): string {
    return required("AUTH_SECRET");
  },
  appUrl: normalizeAppUrl(process.env.APP_URL ?? "http://localhost:3000"),
  port: Number(process.env.PORT ?? 3000),
  llmProvider: provider(process.env.LLM_PROVIDER, "mock", ["mock", "deepseek"] as const),
  emailProvider: provider(process.env.EMAIL_PROVIDER, "console", [
    "console",
    "resend",
    "brevo",
  ] as const),
  storageProvider: provider(process.env.STORAGE_PROVIDER, "local", ["local", "vercel"] as const),
  emailFrom: process.env.EMAIL_FROM ?? "ten-minute-review <onboarding@resend.dev>",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
};

export type Env = typeof env;
