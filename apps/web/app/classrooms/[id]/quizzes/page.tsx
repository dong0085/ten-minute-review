import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getClassroom, listQuizzesForClassroom } from "@tmr/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteQuizButton } from "@/components/classroom/delete-quiz-button";
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
          className="text-sm text-muted-foreground hover:text-foreground"
          href={`/classrooms/${id}`}
        >
          ← {classroom.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("blurb")}</p>
      </div>
      {quizzes.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
            <Link
              className="mt-3 inline-block text-sm text-foreground underline hover:text-muted-foreground"
              href={`/classrooms/${id}/upload`}
            >
              {t("addNotes")}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 transition hover:bg-muted/50"
            >
              <Link
                href={`/classrooms/${id}/quiz/${quiz.id}`}
                className="flex flex-1 items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatQuizDate(quiz.quizDate, locale)}</p>
                    <Badge variant={quiz.kind === "manual" ? "warning" : "secondary"}>
                      {quiz.kind === "manual" ? t("onDemand") : t("daily")}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("questions", { count: quiz.size })}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {quiz.bestScore !== null ? (
                    <p className="font-medium text-foreground">
                      {t("best", { score: quiz.bestScore, size: quiz.size })}
                    </p>
                  ) : (
                    <p>{t("notAttempted")}</p>
                  )}
                  <p>{t("attempts", { count: quiz.attemptCount })}</p>
                </div>
              </Link>
              <DeleteQuizButton quizId={quiz.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
