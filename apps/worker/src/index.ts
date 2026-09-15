import { createDb } from "@tmr/db";
import { runMigrations } from "@tmr/db/migrate";
import { env } from "./env";
import { processNextJob, runWorkerOnce } from "./runner";
import { startHealthServer } from "./server";

const JOB_POLL_INTERVAL_MS = 5000;
const SCHEDULER_INTERVAL_MS = 15 * 60 * 1000;

let running = true;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  startHealthServer(env.port);
  await runMigrations(env.databaseUrl);
  const db = createDb(env.databaseUrl);
  console.log("[worker] started");

  let lastSchedulerTick = 0;
  while (running) {
    try {
      if (running && Date.now() - lastSchedulerTick >= SCHEDULER_INTERVAL_MS) {
        lastSchedulerTick = Date.now();
        const summary = await runWorkerOnce(db);
        console.log(`[worker] scheduled run complete ${JSON.stringify(summary)}`);
      } else if (running) {
        await processNextJob(db);
      }
    } catch (error) {
      console.error("[worker] loop error", error);
    }

    if (running) {
      await sleep(JOB_POLL_INTERVAL_MS);
    }
  }

  console.log("[worker] shutting down");
  process.exit(0);
}

process.on("SIGTERM", () => {
  running = false;
});

process.on("SIGINT", () => {
  running = false;
});

main().catch((error) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
