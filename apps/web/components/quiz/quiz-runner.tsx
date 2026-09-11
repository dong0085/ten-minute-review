"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Input, Label, cn } from "@/components/ui";
import { QuestionReviewCard, type AnswerShape } from "./question-review";

type QuestionKind = "mcq" | "fill_blank" | "true_false" | "image";

type QuizQuestion = {
  id: string;
  position: number;
  category: string;
  type: QuestionKind;
  stem: string;
  options: string[] | null;
  imageUrl?: string | null;
};

type LocalResponse = {
  index?: number | null;
  blanks?: (string | null)[];
  value?: boolean | null;
};

type SubmitResult = {
  attemptId: string;
  correctCount: number;
  questionCount: number;
  results: {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: AnswerShape;
    explanation: string;
  }[];
};

const linkButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100";

function blankCount(stem: string): number {
  const matches = stem.match(/_{2,}/g);
  return Math.max(1, matches?.length ?? 0);
}

function emptyResponse(question: QuizQuestion): LocalResponse {
  if (question.type === "fill_blank") {
    return { blanks: Array.from({ length: blankCount(question.stem) }, () => "") };
  }
  if (question.type === "true_false") {
    return { value: null };
  }
  return { index: null };
}

function isAnswered(question: QuizQuestion, response: LocalResponse | undefined): boolean {
  if (!response) {
    return false;
  }
  if (question.type === "fill_blank") {
    return (response.blanks ?? []).some((blank) => (blank ?? "").trim() !== "");
  }
  if (question.type === "true_false") {
    return response.value === true || response.value === false;
  }
  return typeof response.index === "number";
}

async function readError(response: Response): Promise<string | null> {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string") {
      return message;
    }
  }
  return null;
}

export function QuizRunner({ quizId, classroomId }: { quizId: string; classroomId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, LocalResponse>>({});
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<"loading" | "taking" | "submitting" | "results" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const startedAt = useRef(0);
  const questionStartedAt = useRef(0);
  const durations = useRef<Record<string, number>>({});
  const hasStarted = useRef(false);

  const startAttempt = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setResult(null);
    setResponses({});
    setQuestions([]);
    setCurrent(0);
    durations.current = {};
    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, { method: "POST" });
      if (!response.ok) {
        throw new Error((await readError(response)) ?? "Could not start the quiz.");
      }
      const data = (await response.json()) as { attemptToken: string; questions: QuizQuestion[] };
      setAttemptToken(data.attemptToken);
      setQuestions(data.questions);
      const now = Date.now();
      startedAt.current = now;
      questionStartedAt.current = now;
      setPhase("taking");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start the quiz.");
      setPhase("error");
    }
  }, [quizId]);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;
    void startAttempt();
  }, [startAttempt]);

  const trackTime = useCallback((questionId: string) => {
    const now = Date.now();
    durations.current[questionId] =
      (durations.current[questionId] ?? 0) + (now - questionStartedAt.current);
    questionStartedAt.current = now;
  }, []);

  const goTo = (index: number, questionId: string) => {
    trackTime(questionId);
    setCurrent(index);
  };

  const setAnswer = (questionId: string, response: LocalResponse) => {
    setResponses((previous) => ({ ...previous, [questionId]: response }));
  };

  const submit = async () => {
    if (!attemptToken || questions.length === 0) {
      return;
    }
    const activeQuestion = questions[current];
    if (activeQuestion) {
      trackTime(activeQuestion.id);
    }
    setPhase("submitting");
    setError(null);
    try {
      const response = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptToken,
          durationMs: Date.now() - startedAt.current,
          responses: questions.map((question) => ({
            questionId: question.id,
            response: responses[question.id] ?? emptyResponse(question),
            durationMs: durations.current[question.id] ?? undefined,
          })),
        }),
      });
      if (!response.ok) {
        throw new Error((await readError(response)) ?? "Could not submit the quiz.");
      }
      const data = (await response.json()) as SubmitResult;
      setResult(data);
      setPhase("results");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit the quiz.");
      setPhase("taking");
    }
  };

  if (phase === "loading") {
    return (
      <Card>
        <p className="text-sm text-neutral-600">Preparing your quiz…</p>
      </Card>
    );
  }

  if (phase === "error") {
    return (
      <Card className="space-y-3">
        <Alert tone="error">{error ?? "Could not start the quiz."}</Alert>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void startAttempt()}>Try again</Button>
          <Link href={`/classrooms/${classroomId}/quizzes`} className={linkButtonClass}>
            Back to quizzes
          </Link>
        </div>
      </Card>
    );
  }

  if (phase === "results" && result) {
    const scorePercent =
      result.questionCount > 0
        ? Math.round((result.correctCount / result.questionCount) * 100)
        : 0;
    const scoreTone = scorePercent >= 80 ? "green" : scorePercent >= 50 ? "amber" : "red";
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">
                  {result.correctCount} / {result.questionCount} correct
                </h2>
                <Badge tone={scoreTone}>{scorePercent}%</Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {result.correctCount === result.questionCount
                  ? "Every answer landed."
                  : "Review the missed ones below, then try again."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void startAttempt()}>
                Retake
              </Button>
              <Link
                href={`/classrooms/${classroomId}/attempts/${result.attemptId}`}
                className={linkButtonClass}
              >
                Full review
              </Link>
            </div>
          </div>
        </Card>
        {questions.map((question) => {
          const item = result.results.find((entry) => entry.questionId === question.id);
          if (!item) {
            return null;
          }
          return (
            <QuestionReviewCard
              key={question.id}
              question={question}
              response={responses[question.id]}
              correctAnswer={item.correctAnswer}
              isCorrect={item.isCorrect}
              explanation={item.explanation}
            />
          );
        })}
      </div>
    );
  }

  const currentQuestion = questions[current];
  if (!currentQuestion) {
    return null;
  }
  const response = responses[currentQuestion.id];
  const answeredCount = questions.filter((question) =>
    isAnswered(question, responses[question.id]),
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span>
            {answeredCount} of {questions.length} answered
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card>
        <div className="flex items-center gap-2">
          <Badge>{currentQuestion.category}</Badge>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-base font-medium">{currentQuestion.stem}</p>
        {currentQuestion.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentQuestion.imageUrl}
            alt="Handwritten note"
            className="mt-3 max-h-72 rounded-lg border border-neutral-200 object-contain"
          />
        ) : null}
        {currentQuestion.type === "mcq" || currentQuestion.type === "image" ? (
          <div className="mt-4 space-y-2">
            {(currentQuestion.options ?? []).map((option, index) => {
              const selected = response?.index === index;
              return (
                <label
                  key={`${currentQuestion.id}-${index}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                    selected
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={selected}
                    onChange={() => setAnswer(currentQuestion.id, { index })}
                    className="accent-neutral-900"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        ) : null}
        {currentQuestion.type === "true_false" ? (
          <div className="mt-4 flex gap-2">
            {[true, false].map((value) => {
              const selected = response?.value === value;
              return (
                <Button
                  key={String(value)}
                  type="button"
                  variant={selected ? "primary" : "secondary"}
                  onClick={() => setAnswer(currentQuestion.id, { value })}
                >
                  {value ? "True" : "False"}
                </Button>
              );
            })}
          </div>
        ) : null}
        {currentQuestion.type === "fill_blank" ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: blankCount(currentQuestion.stem) }).map((_, index) => (
              <div key={index}>
                <Label>Blank {index + 1}</Label>
                <Input
                  value={response?.blanks?.[index] ?? ""}
                  onChange={(event) => {
                    const count = blankCount(currentQuestion.stem);
                    const blanks = Array.from(
                      { length: count },
                      (_, blankIndex) => response?.blanks?.[blankIndex] ?? "",
                    );
                    blanks[index] = event.target.value;
                    setAnswer(currentQuestion.id, { blanks });
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="secondary"
          onClick={() => goTo(current - 1, currentQuestion.id)}
          disabled={current === 0}
        >
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => goTo(current + 1, currentQuestion.id)}
            disabled={current === questions.length - 1}
          >
            Next
          </Button>
          <Button onClick={() => void submit()} disabled={phase === "submitting"}>
            {phase === "submitting" ? "Submitting…" : "Submit quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
