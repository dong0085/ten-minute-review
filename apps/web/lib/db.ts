import { createDb, type Db } from "@tmr/db";
import { env } from "./env";

const globalForDb = globalThis as unknown as { __tmrDb?: Db };

export function getDb(): Db {
  if (!globalForDb.__tmrDb) {
    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    globalForDb.__tmrDb = createDb(env.databaseUrl);
  }
  return globalForDb.__tmrDb;
}
