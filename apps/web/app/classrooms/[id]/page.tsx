import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Badge, Card } from "@/components/ui";
import { BankSummary } from "@/components/classroom/bank-summary";
import { LinkButton } from "@/components/classroom/link-button";
import { TodayQuizAction } from "@/components/classroom/today-quiz-action";
import { formatQuizDate } from "@/components/quiz/question-review";
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function firstLine(value: string | null): string {
  const line = (value ?? "").split("\n").find((entry) => entry.trim() !== "");
  return line?.trim() ?? "Text notes";
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
        </Card>
        <Card className="flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Add notes</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Paste your notes or add photos of your handwriting. New material joins the
              question bank.
            </p>
          </div>
          <div>
            <LinkButton href={`/classrooms/${classroom.id}/upload`} variant="secondary">
              Add notes
            </LinkButton>
          </div>
        </Card>
      </div>

      <Card>
        <BankSummary counts={counts} />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent uploads</h2>
          <Link className="text-sm underline" href={`/classrooms/${classroom.id}/history`}>
            View history
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Nothing yet. Add your first notes to get started.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recent.map(({ upload }) => (
              <li key={upload.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {upload.subject ??
                      (upload.kind === "text"
                        ? firstLine(upload.textContent)
                        : (upload.originalFilename ?? "Image notes"))}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatDate(upload.createdAt)}
                  </p>
                </div>
                <Badge tone="neutral">{upload.kind === "text" ? "Text" : "Image"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={`space-y-3${unfinished.length === 0 ? " md:col-span-2" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent quizzes</h2>
            <Link className="text-sm underline" href={`/classrooms/${classroom.id}/quizzes`}>
              View all
            </Link>
          </div>
          {recentQuizzes.length === 0 ? (
            <p className="text-sm text-neutral-600">
              No quizzes yet. They appear after your notes are processed.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentQuizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/classrooms/${classroom.id}/quiz/${quiz.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {formatQuizDate(quiz.quizDate)}
                        </p>
                        <Badge tone={quiz.kind === "manual" ? "amber" : "neutral"}>
                          {quiz.kind === "manual" ? "On demand" : "Daily"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {quiz.size} {quiz.size === 1 ? "question" : "questions"}
                      </p>
                    </div>
                    {quiz.attemptCount === 0 ? (
                      <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900">
                        Take
                      </span>
                    ) : (
                      <p className="shrink-0 text-xs text-neutral-500">
                        Best {quiz.bestScore} / {quiz.size}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {unfinished.length > 0 ? (
          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Unfinished</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Quizzes you created but have not taken yet.
              </p>
            </div>
            <ul className="divide-y divide-neutral-100">
              {unfinished.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/classrooms/${classroom.id}/quiz/${quiz.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{formatQuizDate(quiz.quizDate)}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {quiz.size} {quiz.size === 1 ? "question" : "questions"}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900">
                      Take
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
