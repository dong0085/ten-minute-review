import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getClassroom, listQuizzesForClassroom } from "@tmr/db";
import { Card, Badge } from "@/components/ui";
import { formatQuizDate } from "@/lib/format";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function QuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const t = await getTranslations("Classroom.QuizzesPage");
  const locale = await getLocale();
  const db = getDb();
  const classroom = await getClassroom(db, user.id, id);
  if (!classroom) {
    notFound();
  }
  const quizzes = await listQuizzesForClassroom(db, user.id, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-neutral-600 hover:text-neutral-900"
          href={`/classrooms/${id}`}
        >
          ← {classroom.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("blurb")}</p>
      </div>
      {quizzes.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">{t("empty")}</p>
          <Link
            className="mt-3 inline-block text-sm text-neutral-700 underline hover:text-neutral-900"
            href={`/classrooms/${id}/upload`}
          >
            {t("addNotes")}
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/classrooms/${id}/quiz/${quiz.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:bg-neutral-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{formatQuizDate(quiz.quizDate, locale)}</p>
                  <Badge tone={quiz.kind === "manual" ? "amber" : "neutral"}>
                    {quiz.kind === "manual" ? t("onDemand") : t("daily")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {t("questions", { count: quiz.size })}
                </p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                {quiz.bestScore !== null ? (
                  <p className="font-medium text-neutral-800">
                    {t("best", { score: quiz.bestScore, size: quiz.size })}
                  </p>
                ) : (
                  <p>{t("notAttempted")}</p>
                )}
                <p>{t("attempts", { count: quiz.attemptCount })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
