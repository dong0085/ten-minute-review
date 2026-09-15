import { dailySendAt } from "@tmr/core";
import { enqueueJob, hasPendingComposeJob, listDueClassrooms, reapStaleJobs } from "@tmr/db";
import type { Db } from "@tmr/db";

export async function tickScheduler(db: Db): Promise<number> {
  await reapStaleJobs(db);

  const due = await listDueClassrooms(db, dailySendAt());
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
