import { and, eq, inArray, sql } from "drizzle-orm";
import { enqueueJob, jobs, listDueClassrooms, reapStaleJobs } from "@tmr/db";
import type { Db } from "@tmr/db";

export async function hasPendingComposeJob(db: Db, classroomId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      and(
        eq(jobs.kind, "compose"),
        inArray(jobs.status, ["pending", "running"]),
        sql`${jobs.payload}->>'classroomId' = ${classroomId}`,
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function tickScheduler(db: Db): Promise<number> {
  await reapStaleJobs(db);

  const due = await listDueClassrooms(db);
  let enqueued = 0;
  for (const classroom of due) {
    if (await hasPendingComposeJob(db, classroom.classroomId)) {
      continue;
    }
    await enqueueJob(db, {
      kind: "compose",
      payload: {
        classroomId: classroom.classroomId,
        userId: classroom.userId,
        localDate: classroom.localDate,
      },
    });
    enqueued += 1;
  }
  return enqueued;
}
