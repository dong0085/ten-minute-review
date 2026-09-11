import { eq, sql } from "drizzle-orm";
import { JOB_MAX_ATTEMPTS, JOB_STALE_MINUTES } from "@tmr/core";
import type { JobKind } from "@tmr/core";
import type { Db } from "../client";
import { jobs } from "../schema/jobs";
import type { Job } from "../schema/jobs";

export async function enqueueJob(
  db: Db,
  input: { kind: JobKind; payload?: Record<string, unknown>; runAt?: Date },
) {
  const [job] = await db
    .insert(jobs)
    .values({
      kind: input.kind,
      payload: input.payload ?? {},
      runAt: input.runAt ?? new Date(),
    })
    .returning();
  return job;
}

export async function claimJob(db: Db, workerId: string) {
  const result = await db.execute(sql`
    UPDATE jobs
    SET status = 'running',
        locked_at = now(),
        locked_by = ${workerId},
        attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'pending' AND run_at <= now()
      ORDER BY run_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `);
  const rows = Array.from(result) as unknown as Job[];
  return rows[0] ?? null;
}

export async function completeJob(db: Db, jobId: string) {
  await db
    .update(jobs)
    .set({ status: "done", finishedAt: new Date(), lockedAt: null, lockedBy: null })
    .where(eq(jobs.id, jobId));
}

export async function failJob(db: Db, jobId: string, error: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    return;
  }
  const terminal = job.attempts >= JOB_MAX_ATTEMPTS;
  await db
    .update(jobs)
    .set({
      status: terminal ? "failed" : "pending",
      lastError: error.slice(0, 2000),
      lockedAt: null,
      lockedBy: null,
      finishedAt: terminal ? new Date() : null,
      runAt: new Date(),
    })
    .where(eq(jobs.id, jobId));
}

export async function reapStaleJobs(db: Db) {
  await db.execute(sql`
    UPDATE jobs
    SET status = 'pending',
        locked_at = NULL,
        locked_by = NULL
    WHERE status = 'running'
      AND locked_at < now() - (${JOB_STALE_MINUTES} * interval '1 minute')
      AND attempts < ${JOB_MAX_ATTEMPTS}
  `);
  await db.execute(sql`
    UPDATE jobs
    SET status = 'failed',
        last_error = COALESCE(last_error, 'stalled'),
        finished_at = now(),
        locked_at = NULL,
        locked_by = NULL
    WHERE status = 'running'
      AND locked_at < now() - (${JOB_STALE_MINUTES} * interval '1 minute')
      AND attempts >= ${JOB_MAX_ATTEMPTS}
  `);
}

export async function getJobById(db: Db, jobId: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return job ?? null;
}
