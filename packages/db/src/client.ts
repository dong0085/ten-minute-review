import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export function createClient(connectionString: string, max = 10) {
  return postgres(connectionString, { max, onnotice: () => {} });
}

export function createDbConnection(connectionString: string, max = 10) {
  const client = createClient(connectionString, max);
  const db = drizzle(client, { schema });
  return {
    client,
    db,
    close: () => client.end(),
  };
}

export function createDb(connectionString: string, max = 10) {
  return createDbConnection(connectionString, max).db;
}

export type Db = ReturnType<typeof createDb>;
export type DbClient = ReturnType<typeof createClient>;
