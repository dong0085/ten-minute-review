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
import { users } from "./users";

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
    classroomIds: jsonb("classroom_ids").$type<string[]>().notNull().default([]),
    providerMessageId: text("provider_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("email_sends_user_day_idx").on(table.userId, table.sentOn)],
);

export type EmailPreference = typeof emailPreferences.$inferSelect;
export type NewEmailPreference = typeof emailPreferences.$inferInsert;
export type EmailSend = typeof emailSends.$inferSelect;
export type NewEmailSend = typeof emailSends.$inferInsert;
