import { createDbConnection } from "@tmr/db";
import { env } from "./env";
import { runWorkerOnce } from "./runner";

async function main(): Promise<void> {
  const connection = createDbConnection(env.databaseUrl, 1);
  try {
    const summary = await runWorkerOnce(connection.db);
    console.log(`[worker] run complete ${JSON.stringify(summary)}`);
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error("[worker] fatal", error);
  process.exitCode = 1;
});
