import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createClient } from "./client";

export async function runMigrations(connectionString: string): Promise<void> {
  const client = createClient(connectionString, 1);
  const db = drizzle(client);
  try {
    await migrate(db, {
      migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
    });
  } finally {
    await client.end();
  }
}
