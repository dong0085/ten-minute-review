import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { getAttemptReview, getClassroom, getQuizForUser } from "@tmr/db";
import { Badge, Card } from "@/components/ui";
import { QuestionReviewCard } from "@/components/quiz/question-review";
import { formatQuizDate } from "@/lib/format";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

const linkButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  const user = await requireUser();
  const t = await getTranslations("Classroom.AttemptPage");
  const locale = await getLocale();
  const format = await getFormatter();
  const db = getDb();
  const classroom = await getClassroom(db, user.id, id);
  if (!classroom) {
    notFound();
  }
  const review = await getAttemptReview(db, user.id, attemptId);
  if (!review) {
    notFound();
  }
  const quiz = await getQuizForUser(db, user.id, review.attempt.quizId);
  if (!quiz || quiz.classroomId !== id) {
    notFound();
  }
  const scorePercent =
    review.attempt.questionCount > 0
      ? Math.round((review.attempt.correctCount / review.attempt.questionCount) * 100)
      : 0;
  const scoreTone = scorePercent >= 80 ? "green" : scorePercent >= 50 ? "amber" : "red";

  function formatDuration(ms: number): string {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0
      ? t("durationMinutes", { minutes, seconds })
      : t("durationSeconds", { seconds });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-neutral-600 hover:text-neutral-900"
          href={`/classrooms/${id}/quizzes`}
        >
          {t("allQuizzes")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{classroom.name}</p>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                {t("correct", {
                  correct: review.attempt.correctCount,
                  total: review.attempt.questionCount,
                })}
              </h2>
              <Badge tone={scoreTone}>{scorePercent}%</Badge>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {formatQuizDate(quiz.quizDate, locale)} · {formatDuration(review.attempt.durationMs)}{" "}
              ·{" "}
              {t("submitted", {
                when: format.dateTime(review.attempt.submittedAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/classrooms/${id}/quiz/${quiz.id}`} className={linkButtonClass}>
              {t("retake")}
            </Link>
            <Link href={`/classrooms/${id}?create=1`} className={linkButtonClass}>
              {t("createAnother")}
            </Link>
            <Link href={`/classrooms/${id}/quizzes`} className={linkButtonClass}>
              {t("allQuizzesButton")}
            </Link>
          </div>
        </div>
      </Card>
      {review.answers.map((answer) => (
        <QuestionReviewCard
          key={answer.questionId}
          question={{
            position: answer.position,
            category: answer.category,
            type: answer.type,
            stem: answer.stem,
            options: answer.options,
          }}
          response={answer.response}
          correctAnswer={answer.answer}
          isCorrect={answer.isCorrect}
          explanation={answer.explanation}
        />
      ))}
    </div>
  );
}
