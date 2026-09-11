import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { QuizKind } from "@tmr/core";
import { users } from "./users";
import { quizzes } from "./quizzes";

export const emailPreferences = pgTable("email_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  dailyEnabled: boolean("daily_enabled").notNull().default(true),
  sendHourLocal: integer("send_hour_local").notNull().default(7),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const emailSends = pgTable(
  "email_sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sentOn: date("sent_on", { mode: "string" }).notNull(),
    kind: text("kind").$type<QuizKind>().notNull().default("daily"),
    quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }),
    classroomIds: jsonb("classroom_ids").$type<string[]>().notNull().default([]),
    providerMessageId: text("provider_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("email_sends_user_day_daily_idx")
      .on(table.userId, table.sentOn)
      .where(sql`kind = 'daily'`),
    uniqueIndex("email_sends_user_quiz_idx").on(table.userId, table.quizId),
  ],
);

export type EmailPreference = typeof emailPreferences.$inferSelect;
export type NewEmailPreference = typeof emailPreferences.$inferInsert;
export type EmailSend = typeof emailSends.$inferSelect;
export type NewEmailSend = typeof emailSends.$inferInsert;
