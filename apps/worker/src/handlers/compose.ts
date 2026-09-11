import {
  COMPOSITION_PROMPT_V1,
  COMPOSITION_PROMPT_VERSION,
  MIN_USABLE_QUESTIONS,
  parseCompositionResponse,
  parseCompositionResult,
  quizSize,
  sanitizeCompositionQuestions,
} from "@tmr/core";
import type { KnowledgePointDetail } from "@tmr/core";
import {
  createQuizWithQuestions,
  enqueueJob,
  getClassroom,
  getQuizByClassroomAndDate,
  listKnowledgePointsForComposition,
  listRecentMisses,
  listWeekQuestionStems,
} from "@tmr/db";
import type { Db, NewQuestion } from "@tmr/db";
import { getLlmProvider } from "../llm";

const DAY_MS = 24 * 60 * 60 * 1000;

function requireString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`compose job payload is missing ${key}`);
  }
  return value;
}

export function passageIdFromDetail(detail: KnowledgePointDetail | null): string | null {
  const value = (detail as { passage_ref?: unknown } | null)?.passage_ref;
  return typeof value === "string" ? value : null;
}

export async function handleComposeJob(
  db: Db,
  payload: Record<string, unknown>,
): Promise<void> {
  const classroomId = requireString(payload, "classroomId");
  const userId = requireString(payload, "userId");
  const localDate = requireString(payload, "localDate");

  const existing = await getQuizByClassroomAndDate(db, classroomId, localDate);
  if (existing) {
    return;
  }

  const classroom = await getClassroom(db, userId, classroomId);
  if (!classroom) {
    throw new Error(`classroom ${classroomId} not found for user ${userId}`);
  }

  const bank = await listKnowledgePointsForComposition(db, classroomId);
  if (bank.length === 0) {
    console.log(`[worker] compose ${classroomId} ${localDate}: empty bank, nothing to compose`);
    return;
  }
  const size = quizSize(bank.length);

  const compositionPayload = {
    targetLanguage: classroom.targetLanguage,
    nativeLanguage: classroom.nativeLanguage,
    size,
    knowledgePoints: bank.map((point) => ({
      id: point.id,
      category: point.category,
      target: point.targetText,
      native: point.nativeText,
      detail: point.detail,
    })),
    alreadyAskedStems: await listWeekQuestionStems(db, classroomId, new Date(Date.now() - 7 * DAY_MS)),
    recentMisses: await listRecentMisses(db, userId, classroomId, new Date(Date.now() - 30 * DAY_MS)),
  };

  const provider = getLlmProvider();
  const raw = await provider.compose({
    systemPrompt: COMPOSITION_PROMPT_V1,
    payload: compositionPayload,
  });
  const parsed = typeof raw === "string" ? parseCompositionResponse(raw) : parseCompositionResult(raw);

  const validIds = new Set(bank.map((point) => point.id));
  const { kept: usable, dropped } = sanitizeCompositionQuestions(parsed.questions, validIds);
  const kept = usable.slice(0, size);
  if (kept.length < MIN_USABLE_QUESTIONS) {
    throw new Error(`only ${kept.length} usable questions`);
  }

  const detailById = new Map(bank.map((point) => [point.id, point.detail]));
  const questions: Omit<NewQuestion, "quizId">[] = kept.map((question, index) => ({
    knowledgePointId: question.knowledge_point_id,
    passageId: passageIdFromDetail(detailById.get(question.knowledge_point_id) ?? null),
    position: index,
    category: question.category,
    type: question.type,
    stem: question.stem,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    promptVersion: COMPOSITION_PROMPT_VERSION,
  }));

  const { quiz } = await createQuizWithQuestions(db, {
    classroomId,
    userId,
    quizDate: localDate,
    size: kept.length,
    promptVersion: COMPOSITION_PROMPT_VERSION,
    questions,
  });
  if (!quiz) {
    throw new Error(`failed to create quiz for classroom ${classroomId} on ${localDate}`);
  }

  await enqueueJob(db, { kind: "send_email", payload: { userId, quizDate: localDate } });
  console.log(
    `[worker] compose ${classroomId} ${localDate}: ${kept.length} questions (${dropped.length} dropped)`,
  );
}
