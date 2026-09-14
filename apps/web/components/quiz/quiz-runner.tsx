"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, type Category } from "@tmr/core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { clearQuizDraft, loadQuizDraft, saveQuizDraft } from "@/lib/quiz-draft";
import { QuestionReviewCard, type AnswerShape } from "./question-review";
import type { LocalResponse, QuizQuestion } from "./types";

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

class ApiRequestError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function readError(response: Response): Promise<ApiRequestError | null> {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string") {
      const code = (data as { code?: unknown }).code;
      return new ApiRequestError(message, typeof code === "string" ? code : undefined);
    }
  }
  return null;
}

export function QuizRunner({
  quizId,
  classroomId,
  userId,
}: {
  quizId: string;
  classroomId: string;
  userId: string;
}) {
  const t = useTranslations("Quiz.Runner");
  const tReview = useTranslations("Quiz.QuestionReview");
  const categoryT = useTranslations("Category");
  const categoryLabel = (category: string) =>
    CATEGORIES.includes(category as Category) ? categoryT(category as Category) : category;
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
  const blankRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusFirstBlank = useRef(false);

  const startAttempt = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setResult(null);
    setResponses({});
    setQuestions([]);
    setCurrent(0);
    durations.current = {};
    try {
      const draft = loadQuizDraft(userId, quizId);
      if (draft) {
        const response = await fetch(`/api/quizzes/${quizId}`);
        if (!response.ok) {
          throw (await readError(response)) ?? new ApiRequestError(t("startError"));
        }
        const data = (await response.json()) as { quiz: { questions: QuizQuestion[] } };
        const restoredQuestions = data.quiz.questions;
        setAttemptToken(draft.attemptToken);
        setQuestions(restoredQuestions);
        setResponses(draft.responses);
        setCurrent(Math.max(0, Math.min(draft.current, restoredQuestions.length - 1)));
        durations.current = draft.durations;
        startedAt.current = draft.startedAt;
        questionStartedAt.current = draft.questionStartedAt;
        setPhase("taking");
        return;
      }
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, { method: "POST" });
      if (!response.ok) {
        throw (await readError(response)) ?? new ApiRequestError(t("startError"));
      }
      const data = (await response.json()) as { attemptToken: string; questions: QuizQuestion[] };
      setAttemptToken(data.attemptToken);
      setQuestions(data.questions);
      const now = Date.now();
      startedAt.current = now;
      questionStartedAt.current = now;
      setPhase("taking");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : t("startError"));
      setPhase("error");
    }
  }, [quizId, userId, t]);

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

  useEffect(() => {
    if (phase !== "taking" || !attemptToken) {
      return;
    }
    saveQuizDraft(userId, quizId, {
      version: 1,
      attemptToken,
      startedAt: startedAt.current,
      questionStartedAt: questionStartedAt.current,
      responses,
      current,
      durations: durations.current,
      savedAt: Date.now(),
    });
  }, [attemptToken, current, phase, quizId, responses, userId]);

  useEffect(() => {
    if (phase !== "taking" || !focusFirstBlank.current) {
      return;
    }
    focusFirstBlank.current = false;
    blankRefs.current[0]?.focus();
  }, [current, phase]);

  const submit = useCallback(async () => {
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
        throw (await readError(response)) ?? new ApiRequestError(t("submitError"));
      }
      const data = (await response.json()) as SubmitResult;
      clearQuizDraft(userId, quizId);
      setResult(data);
      setPhase("results");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t("submitError");
      if (submitError instanceof ApiRequestError && submitError.code === "attempt_invalid") {
        clearQuizDraft(userId, quizId);
      }
      setError(message);
      setPhase("taking");
      toast.error(message);
    }
  }, [attemptToken, current, questions, quizId, responses, t, trackTime, userId]);

  const goNext = useCallback(() => {
    const activeQuestion = questions[current];
    if (!activeQuestion) {
      return;
    }
    if (current < questions.length - 1) {
      focusFirstBlank.current = true;
      trackTime(activeQuestion.id);
      setCurrent(current + 1);
      return;
    }
    void submit();
  }, [current, questions, submit, trackTime]);

  useEffect(() => {
    if (phase !== "taking") {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.isComposing) {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (
        target instanceof HTMLButtonElement ||
        target instanceof HTMLAnchorElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      event.preventDefault();
      if (target instanceof HTMLInputElement && target.type === "text") {
        const index = blankRefs.current.indexOf(target);
        const activeQuestion = questions[current];
        const count = activeQuestion ? blankCount(activeQuestion.stem) : 0;
        if (index >= 0 && index < count - 1) {
          blankRefs.current[index + 1]?.focus();
          return;
        }
      }
      goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, goNext, phase, questions]);

  if (phase === "loading") {
    return (
      <Card>
        <CardContent className="space-y-4">
          <span className="sr-only">{t("loading")}</span>
          <Skeleton className="h-5 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "error") {
    return (
      <Card>
        <CardContent className="space-y-3">
          <Alert variant="destructive">
            <AlertDescription>{error ?? t("startError")}</AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void startAttempt()}>{t("tryAgain")}</Button>
            <Button asChild variant="outline">
              <Link href={`/classrooms/${classroomId}/quizzes`}>{t("backToQuizzes")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "results" && result) {
    const scorePercent =
      result.questionCount > 0
        ? Math.round((result.correctCount / result.questionCount) * 100)
        : 0;
    const scoreTone =
      scorePercent >= 80 ? "success" : scorePercent >= 50 ? "warning" : "destructive";
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">
                  {t("score", {
                    correct: result.correctCount,
                    total: result.questionCount,
                  })}
                </h2>
                <Badge variant={scoreTone}>{scorePercent}%</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.correctCount === result.questionCount
                  ? t("everyAnswerLanded")
                  : t("reviewMissed")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void startAttempt()}>
                {t("retake")}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/classrooms/${classroomId}/attempts/${result.attemptId}`}>
                  {t("fullReview")}
                </Link>
              </Button>
            </div>
          </CardContent>
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("questionProgress", { current: current + 1, total: questions.length })}
          </span>
          <span>
            {t("answeredProgress", { answered: answeredCount, total: questions.length })}
          </span>
        </div>
        <Progress className="mt-2 h-1.5" value={((current + 1) / questions.length) * 100} />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{categoryLabel(currentQuestion.category)}</Badge>
          </div>
          <p className="whitespace-pre-wrap text-base font-medium">{currentQuestion.stem}</p>
          {currentQuestion.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentQuestion.imageUrl}
              alt={tReview("handwritten")}
              className="max-h-72 rounded-lg border border-border object-contain"
            />
          ) : null}
          {currentQuestion.type === "mcq" || currentQuestion.type === "image" ? (
            <RadioGroup
              value={typeof response?.index === "number" ? String(response.index) : ""}
              onValueChange={(value) =>
                setAnswer(currentQuestion.id, { index: Number(value) })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.repeat) {
                  event.preventDefault();
                  goNext();
                }
              }}
            >
              {(currentQuestion.options ?? []).map((option, index) => {
                const selected = response?.index === index;
                const optionId = `${currentQuestion.id}-option-${index}`;
                return (
                  <Label
                    key={optionId}
                    htmlFor={optionId}
                    className={cn(
                      "mb-0 w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm leading-normal font-normal",
                      selected ? "border-primary bg-muted" : "border-border hover:bg-muted",
                    )}
                  >
                    <RadioGroupItem value={String(index)} id={optionId} />
                    <span>{option}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          ) : null}
          {currentQuestion.type === "true_false" ? (
            <div className="flex gap-2">
              {[true, false].map((value) => {
                const selected = response?.value === value;
                return (
                  <Button
                    key={String(value)}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    onClick={() => setAnswer(currentQuestion.id, { value })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.repeat) {
                        event.preventDefault();
                        goNext();
                      }
                    }}
                  >
                    {value ? tReview("true") : tReview("false")}
                  </Button>
                );
              })}
            </div>
          ) : null}
          {currentQuestion.type === "fill_blank" ? (
            <div className="space-y-3">
              {Array.from({ length: blankCount(currentQuestion.stem) }).map((_, index) => (
                <div key={index}>
                  <Label htmlFor={`${currentQuestion.id}-blank-${index}`}>
                    {t("blank", { number: index + 1 })}
                  </Label>
                  <Input
                    id={`${currentQuestion.id}-blank-${index}`}
                    ref={(element) => {
                      blankRefs.current[index] = element;
                    }}
                  value={response?.blanks?.[index] ?? ""}
                  enterKeyHint={
                    index < blankCount(currentQuestion.stem) - 1 ||
                    current < questions.length - 1
                      ? "next"
                      : "go"
                  }
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
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => goTo(current - 1, currentQuestion.id)}
          disabled={current === 0}
        >
          {t("back")}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => goTo(current + 1, currentQuestion.id)}
            disabled={current === questions.length - 1}
          >
            {t("next")}
          </Button>
          <Button onClick={() => void submit()} disabled={phase === "submitting"}>
            {phase === "submitting" ? <Loader2 className="animate-spin" /> : null}
            {phase === "submitting" ? t("submitting") : t("submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
