import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizWithQuestionsForUser } from "@tmr/db";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { formatQuizDate } from "@/components/quiz/question-review";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const user = await requireUser();
  const data = await getQuizWithQuestionsForUser(getDb(), user.id, quizId);
  if (!data || data.quiz.classroomId !== id) {
    notFound();
  }
  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-neutral-600 hover:text-neutral-900"
          href={`/classrooms/${id}/quizzes`}
        >
          ← All quizzes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{formatQuizDate(data.quiz.quizDate)}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {data.quiz.size} questions. Answers are revealed after you submit.
        </p>
      </div>
      <QuizRunner quizId={quizId} classroomId={id} />
    </div>
  );
}
