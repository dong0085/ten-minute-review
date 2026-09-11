import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export function createClient(connectionString: string, max = 10) {
  return postgres(connectionString, { max, onnotice: () => {} });
}

export function createDb(connectionString: string, max = 10) {
  const client = createClient(connectionString, max);
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
export type DbClient = ReturnType<typeof createClient>;
