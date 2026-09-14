import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import {
  bankSize,
  countBankByCategory,
  getClassroom,
  getDailyQuizByClassroomAndDate,
  getLatestComposeJob,
  listQuizzesForClassroom,
  listUntakenOnDemandQuizzes,
  listUploadsForUser,
} from "@tmr/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BankSummary } from "@/components/classroom/bank-summary";
import { TodayQuizAction } from "@/components/classroom/today-quiz-action";
import { formatQuizDate } from "@/lib/format";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

const REHYDRATE_WINDOW_MS = 10 * 60 * 1000;

function localDate(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function firstLine(value: string | null, fallback: string): string {
  const line = (value ?? "").split("\n").find((entry) => entry.trim() !== "");
  return line?.trim() ?? fallback;
}

function nowMs(): number {
  return new Date().getTime();
}

export default async function ClassroomHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { create } = await searchParams;
  const user = await requireUser();
  const t = await getTranslations("Classroom.HomePage");
  const locale = await getLocale();
  const format = await getFormatter();
  const db = getDb();
  const classroom = await getClassroom(db, user.id, id);
  if (!classroom) {
    notFound();
  }

  const today = localDate(user.timezone);
  const [counts, size, dailyQuiz, uploads, quizzes, unfinished, composeJob] =
    await Promise.all([
      countBankByCategory(db, user.id, classroom.id),
      bankSize(db, classroom.id),
      getDailyQuizByClassroomAndDate(db, classroom.id, today),
      listUploadsForUser(db, user.id, classroom.id),
      listQuizzesForClassroom(db, user.id, classroom.id),
      listUntakenOnDemandQuizzes(db, classroom.id, 3),
      getLatestComposeJob(db, classroom.id, REHYDRATE_WINDOW_MS),
    ]);
  const recent = uploads.slice(0, 3);
  const recentQuizzes = quizzes.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            <TodayQuizAction
              classroomId={classroom.id}
              dailyQuizId={dailyQuiz?.id ?? null}
              bankSize={size}
              nowMs={nowMs()}
              autoStart={create === "1"}
              initialJob={
                composeJob
                  ? {
                      status: composeJob.status as "pending" | "running",
                      requestedAt: composeJob.createdAt.toISOString(),
                    }
                  : null
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t("addNotesTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("addNotesBlurb")}</p>
            </div>
            <div>
              <Button asChild variant="outline">
                <Link href={`/classrooms/${classroom.id}/upload`}>{t("addNotes")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <BankSummary counts={counts} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("recentUploads")}</h2>
            <Link className="text-sm underline" href={`/classrooms/${classroom.id}/history`}>
              {t("viewHistory")}
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noUploads")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map(({ upload }) => (
                <li key={upload.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {upload.subject ??
                        (upload.kind === "text"
                          ? firstLine(upload.textContent, t("textNotes"))
                          : (upload.originalFilename ?? t("imageNotes")))}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format.dateTime(upload.createdAt, { dateStyle: "medium" })}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {upload.kind === "text" ? t("text") : t("image")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={unfinished.length === 0 ? "md:col-span-2" : undefined}>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("recentQuizzes")}</h2>
              <Link className="text-sm underline" href={`/classrooms/${classroom.id}/quizzes`}>
                {t("viewAll")}
              </Link>
            </div>
            {recentQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noQuizzes")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentQuizzes.map((quiz) => (
                  <li key={quiz.id}>
                    <Link
                      href={`/classrooms/${classroom.id}/quiz/${quiz.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {formatQuizDate(quiz.quizDate, locale)}
                          </p>
                          <Badge variant={quiz.kind === "manual" ? "warning" : "secondary"}>
                            {quiz.kind === "manual" ? t("onDemand") : t("daily")}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("questions", { count: quiz.size })}
                        </p>
                      </div>
                      {quiz.attemptCount === 0 ? (
                        <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
                          {t("take")}
                        </span>
                      ) : (
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {t("best", { score: quiz.bestScore ?? 0, size: quiz.size })}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {unfinished.length > 0 ? (
          <Card>
            <CardContent className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">{t("unfinished")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("unfinishedBlurb")}</p>
              </div>
              <ul className="divide-y divide-border">
                {unfinished.map((quiz) => (
                  <li key={quiz.id}>
                    <Link
                      href={`/classrooms/${classroom.id}/quiz/${quiz.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {formatQuizDate(quiz.quizDate, locale)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("questions", { count: quiz.size })}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
                        {t("take")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
