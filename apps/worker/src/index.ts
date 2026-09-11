import os from "node:os";
import {
  claimJob,
  completeJob,
  createDb,
  failJob,
  runMigrations,
} from "@tmr/db";
import type { Db, Job } from "@tmr/db";
import { env } from "./env";
import { handleComposeJob } from "./handlers/compose";
import { handleExtractJob } from "./handlers/extract";
import { handleSendEmailJob } from "./handlers/send-email";
import { tickScheduler } from "./scheduler";

const workerId = `${os.hostname()}:${process.pid}`;
const JOB_POLL_INTERVAL_MS = 5000;
const SCHEDULER_INTERVAL_MS = 15 * 60 * 1000;

let running = true;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runJob(db: Db, job: Job): Promise<void> {
  switch (job.kind) {
    case "extract":
      return handleExtractJob(db, job.payload);
    case "compose":
      return handleComposeJob(db, job.payload);
    case "send_email":
      return handleSendEmailJob(db, job.payload);
    default:
      throw new Error(`unknown job kind: ${String(job.kind)}`);
  }
}

async function processNextJob(db: Db): Promise<boolean> {
  const job = await claimJob(db, workerId);
  if (!job) {
    return false;
  }
  try {
    await runJob(db, job);
    await completeJob(db, job.id);
    console.log(`[worker] ${job.kind} ${job.id} done`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await failJob(db, job.id, message);
    console.error(`[worker] ${job.kind} ${job.id} failed: ${message}`);
  }
  return true;
}

async function main(): Promise<void> {
  await runMigrations(env.databaseUrl);
  const db = createDb(env.databaseUrl);
  console.log(`[worker] started ${workerId}`);

  let lastSchedulerTick = 0;
  while (running) {
    try {
      while (running && (await processNextJob(db))) {
        // drain the queue before sleeping
      }

      if (running && Date.now() - lastSchedulerTick >= SCHEDULER_INTERVAL_MS) {
        lastSchedulerTick = Date.now();
        const enqueued = await tickScheduler(db);
        if (enqueued > 0) {
          console.log(`[worker] scheduler enqueued ${enqueued} compose job(s)`);
        }
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
