import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { JobKind, JobStatus } from "@tmr/core";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").$type<JobKind>().notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").$type<JobStatus>().notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("jobs_pending_idx")
      .on(table.status, table.runAt)
      .where(sql`status = 'pending'`),
  ],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
