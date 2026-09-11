import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Category, KnowledgePointDetail } from "@tmr/core";
import { classrooms, uploads } from "./classrooms";

export const knowledgePoints = pgTable(
  "knowledge_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    sourceUploadId: uuid("source_upload_id")
      .notNull()
      .references(() => uploads.id, { onDelete: "cascade" }),
    category: text("category").$type<Category>().notNull(),
    targetText: text("target_text").notNull(),
    nativeText: text("native_text"),
    inferred: boolean("inferred").notNull().default(false),
    note: text("note"),
    detail: jsonb("detail").$type<KnowledgePointDetail>(),
    sourceExcerpt: text("source_excerpt"),
    promptVersion: text("prompt_version").notNull(),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("knowledge_points_classroom_created_idx").on(table.classroomId, table.createdAt)],
);

export const passages = pgTable(
  "passages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    sourceUploadId: uuid("source_upload_id")
      .notNull()
      .references(() => uploads.id, { onDelete: "cascade" }),
    targetText: text("target_text").notNull(),
    nativeText: text("native_text"),
    sourceExcerpt: text("source_excerpt"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("passages_classroom_idx").on(table.classroomId)],
);

export type KnowledgePoint = typeof knowledgePoints.$inferSelect;
export type NewKnowledgePoint = typeof knowledgePoints.$inferInsert;
export type Passage = typeof passages.$inferSelect;
export type NewPassage = typeof passages.$inferInsert;
