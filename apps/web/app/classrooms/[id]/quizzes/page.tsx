import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassroom, listQuizzesForClassroom } from "@tmr/db";
import { Card, Badge } from "@/components/ui";
import { formatQuizDate } from "@/components/quiz/question-review";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function QuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
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
        <h1 className="mt-2 text-2xl font-semibold">Quizzes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          One daily quiz each morning, plus any you create on demand. Attempts are
          unlimited.
        </p>
      </div>
      {quizzes.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No quizzes yet. They are composed after your notes are processed.
          </p>
          <Link
            className="mt-3 inline-block text-sm text-neutral-700 underline hover:text-neutral-900"
            href={`/classrooms/${id}/upload`}
          >
            Add notes
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
                  <p className="text-sm font-medium">{formatQuizDate(quiz.quizDate)}</p>
                  <Badge tone={quiz.kind === "manual" ? "amber" : "neutral"}>
                    {quiz.kind === "manual" ? "On demand" : "Daily"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {quiz.size} {quiz.size === 1 ? "question" : "questions"}
                </p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                {quiz.bestScore !== null ? (
                  <p className="font-medium text-neutral-800">
                    Best {quiz.bestScore} / {quiz.size}
                  </p>
                ) : (
                  <p>Not attempted</p>
                )}
                <p>
                  {quiz.attemptCount} {quiz.attemptCount === 1 ? "attempt" : "attempts"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
