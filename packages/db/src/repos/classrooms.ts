import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { ExtractionDiscard, UploadKind } from "@tmr/core";
import type { Db } from "../client";
import { classrooms, uploads } from "../schema/classrooms";

export type CreateClassroomInput = {
  name: string;
  targetLanguage: string;
  nativeLanguage: string;
  autoStopDays?: number;
  activeUntil: Date;
};

export type UpdateClassroomInput = {
  name?: string;
  targetLanguage?: string;
  nativeLanguage?: string;
  autoStopDays?: number;
};

export async function listClassrooms(
  db: Db,
  userId: string,
  options: { includeArchived?: boolean } = {},
) {
  const conditions = [eq(classrooms.userId, userId)];
  if (!options.includeArchived) {
    conditions.push(isNull(classrooms.archivedAt));
  }
  return db
    .select()
    .from(classrooms)
    .where(and(...conditions))
    .orderBy(desc(classrooms.createdAt));
}

export async function countClassrooms(db: Db, userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(classrooms)
    .where(and(eq(classrooms.userId, userId), isNull(classrooms.archivedAt)));
  return Number(row?.value ?? 0);
}

export async function getClassroom(db: Db, userId: string, classroomId: string) {
  const [classroom] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.userId, userId)))
    .limit(1);
  return classroom ?? null;
}

export async function createClassroom(db: Db, userId: string, input: CreateClassroomInput) {
  const [classroom] = await db
    .insert(classrooms)
    .values({
      userId,
      name: input.name,
      targetLanguage: input.targetLanguage,
      nativeLanguage: input.nativeLanguage,
      autoStopDays: input.autoStopDays ?? 7,
      activeUntil: input.activeUntil,
    })
    .returning();
  return classroom;
}

export async function updateClassroom(
  db: Db,
  userId: string,
  classroomId: string,
  patch: UpdateClassroomInput,
) {
  const [classroom] = await db
    .update(classrooms)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.userId, userId)))
    .returning();
  return classroom ?? null;
}

export async function archiveClassroom(db: Db, userId: string, classroomId: string) {
  const [classroom] = await db
    .update(classrooms)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.userId, userId)))
    .returning();
  return classroom ?? null;
}

export async function deleteClassroom(db: Db, userId: string, classroomId: string) {
  await db
    .delete(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.userId, userId)));
}

export async function extendClassroomActivity(
  db: Db,
  userId: string,
  days: number,
  classroomId?: string,
) {
  const conditions = [eq(classrooms.userId, userId), isNull(classrooms.archivedAt)];
  if (classroomId) {
    conditions.push(eq(classrooms.id, classroomId));
  }
  await db
    .update(classrooms)
    .set({
      activeUntil: sql`GREATEST(${classrooms.activeUntil}, now()) + (${days} * interval '1 day')`,
      updatedAt: new Date(),
    })
    .where(and(...conditions));
}

export async function extendClassroomActivityForLogin(db: Db, userId: string) {
  await db
    .update(classrooms)
    .set({
      activeUntil: sql`GREATEST(${classrooms.activeUntil}, now()) + (${classrooms.autoStopDays} * interval '1 day')`,
      updatedAt: new Date(),
    })
    .where(and(eq(classrooms.userId, userId), isNull(classrooms.archivedAt)));
}

export type DueClassroom = {
  classroomId: string;
  userId: string;
  timezone: string;
  localDate: string;
};

export async function listDueClassrooms(db: Db) {
  const rows = await db.execute<DueClassroom>(sql`
    SELECT
      c.id AS "classroomId",
      u.id AS "userId",
      u.timezone AS "timezone",
      to_char((now() AT TIME ZONE u.timezone)::date, 'YYYY-MM-DD') AS "localDate"
    FROM classrooms c
    JOIN users u ON u.id = c.user_id
    JOIN email_preferences ep ON ep.user_id = u.id
    WHERE c.archived_at IS NULL
      AND c.active_until > now()
      AND ep.daily_enabled
      AND ep.unsubscribed_at IS NULL
      AND date_part('hour', now() AT TIME ZONE u.timezone) >= ep.send_hour_local
      AND NOT EXISTS (
        SELECT 1 FROM quizzes q
        WHERE q.classroom_id = c.id
          AND q.quiz_date = (now() AT TIME ZONE u.timezone)::date
          AND q.kind = 'daily'
      )
  `);
  return Array.from(rows) as DueClassroom[];
}

export type CreateUploadInput = {
  classroomId: string;
  kind: UploadKind;
  textContent?: string | null;
  storageKey?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  byteSize?: number | null;
};

export async function createUpload(db: Db, input: CreateUploadInput) {
  const [upload] = await db
    .insert(uploads)
    .values({
      classroomId: input.classroomId,
      kind: input.kind,
      textContent: input.textContent ?? null,
      storageKey: input.storageKey ?? null,
      originalFilename: input.originalFilename ?? null,
      mimeType: input.mimeType ?? null,
      byteSize: input.byteSize ?? null,
    })
    .returning();
  return upload;
}

export async function getUploadForUser(db: Db, userId: string, uploadId: string) {
  const [row] = await db
    .select({ upload: uploads, classroom: classrooms })
    .from(uploads)
    .innerJoin(classrooms, eq(uploads.classroomId, classrooms.id))
    .where(and(eq(uploads.id, uploadId), eq(classrooms.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getUploadById(db: Db, uploadId: string) {
  const [upload] = await db.select().from(uploads).where(eq(uploads.id, uploadId)).limit(1);
  return upload ?? null;
}

export async function listUploadsForUser(db: Db, userId: string, classroomId: string) {
  return db
    .select({ upload: uploads })
    .from(uploads)
    .innerJoin(classrooms, eq(uploads.classroomId, classrooms.id))
    .where(and(eq(uploads.classroomId, classroomId), eq(classrooms.userId, userId)))
    .orderBy(desc(uploads.createdAt));
}

export async function markUploadRunning(db: Db, uploadId: string) {
  await db
    .update(uploads)
    .set({ extractionStatus: "running", extractionError: null })
    .where(eq(uploads.id, uploadId));
}

export async function completeUploadExtraction(
  db: Db,
  uploadId: string,
  discarded: ExtractionDiscard[],
  subject: string | null,
) {
  await db
    .update(uploads)
    .set({
      extractionStatus: "done",
      extractedAt: new Date(),
      extractionError: null,
      discarded,
      subject,
    })
    .where(eq(uploads.id, uploadId));
}

export async function failUploadExtraction(db: Db, uploadId: string, error: string) {
  await db
    .update(uploads)
    .set({ extractionStatus: "failed", extractionError: error.slice(0, 2000) })
    .where(eq(uploads.id, uploadId));
}

export async function countUploadsSince(db: Db, userId: string, since: Date) {
  const [row] = await db
    .select({ value: count() })
    .from(uploads)
    .innerJoin(classrooms, eq(uploads.classroomId, classrooms.id))
    .where(and(eq(classrooms.userId, userId), gte(uploads.createdAt, since)));
  return Number(row?.value ?? 0);
}
