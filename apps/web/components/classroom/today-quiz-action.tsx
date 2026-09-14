"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JobStatus = "pending" | "running";
type Phase = "idle" | "posting" | "composing" | "ready" | "stopped" | "failed";

type TodayResponse = {
  quiz: { id: string } | null;
  job: { status: JobStatus; requestedAt: string } | null;
};

const POLL_MS = 3000;
const TIMEOUT_SECONDS = 90;
const MIN_STEP_MS = 600;

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function TodayQuizAction({
  classroomId,
  dailyQuizId,
  bankSize,
  nowMs,
  autoStart = false,
  initialJob,
}: {
  classroomId: string;
  dailyQuizId: string | null;
  bankSize: number;
  nowMs: number;
  autoStart?: boolean;
  initialJob: { status: JobStatus; requestedAt: string } | null;
}) {
  const t = useTranslations("Classroom.TodayQuiz");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const autoStartedRef = useRef(false);
  const initialElapsed = initialJob
    ? Math.max(0, (nowMs - Date.parse(initialJob.requestedAt)) / 1000)
    : 0;
  const [phase, setPhase] = useState<Phase>(initialJob ? "composing" : "idle");
  const [minimized, setMinimized] = useState(Boolean(initialJob));
  const [step, setStep] = useState<JobStatus>(initialJob?.status ?? "pending");
  const stepEnteredAtRef = useRef(nowMs);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsed, setElapsed] = useState(Math.floor(initialElapsed));
  const [readyQuizId, setReadyQuizId] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const activeQuizId = dailyQuizId ?? readyQuizId;
  const showModal = phase !== "idle" && !minimized;

  const fetchToday = useCallback(async (): Promise<TodayResponse | null> => {
    const response = await fetch(`/api/classrooms/${classroomId}/quizzes/today`);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as TodayResponse;
  }, [classroomId]);

  useEffect(() => {
    if (phase !== "composing") {
      return;
    }
    const interval = setInterval(() => {
      setElapsed((current) => current + POLL_MS / 1000);
      void fetchToday().then((data) => {
        if (!data) {
          return;
        }
        if (data.quiz) {
          setReadyQuizId(data.quiz.id);
          setPhase("ready");
          router.refresh();
          return;
        }
        if (!data.job) {
          setPhase("failed");
          return;
        }
        if (data.job.status === "running" && step === "pending") {
          const wait = Math.max(0, MIN_STEP_MS - (Date.now() - stepEnteredAtRef.current));
          advanceTimeoutRef.current = setTimeout(() => {
            stepEnteredAtRef.current = Date.now();
            setStep("running");
          }, wait);
        }
      });
    }, POLL_MS);
    return () => {
      clearInterval(interval);
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [phase, fetchToday, router, step]);

  const minimize = useCallback(() => {
    setEntered(false);
    setMinimized(true);
  }, []);

  useEffect(() => {
    if (!showModal) {
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    dialogRef.current?.focus();
    return () => cancelAnimationFrame(frame);
  }, [showModal]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setPhase("idle");
      setMinimized(false);
      setStep("pending");
      setEntered(false);
    }, 180);
  }, []);

  const start = useCallback(async () => {
    setPhase("posting");
    setMinimized(false);
    setStep("pending");
    stepEnteredAtRef.current = Date.now();
    setElapsed(0);
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/quizzes`, {
        method: "POST",
      });
      if (response.status === 409) {
        setPhase("failed");
        return;
      }
      if (!response.ok) {
        setPhase("failed");
        return;
      }
      const data = (await response.json()) as { status?: string };
      if (data.status === "ready") {
        const today = await fetchToday();
        if (today?.quiz) {
          setReadyQuizId(today.quiz.id);
          setPhase("ready");
          return;
        }
      }
      setPhase("composing");
    } catch {
      setPhase("failed");
    }
  }, [classroomId, fetchToday]);

  const cancel = useCallback(async () => {
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/quizzes/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { outcome?: string };
      if (data.outcome === "too_late") {
        const today = await fetchToday();
        if (today?.quiz) {
          setReadyQuizId(today.quiz.id);
          setPhase("ready");
          router.refresh();
          return;
        }
      }
      setPhase("stopped");
      router.refresh();
    } catch {
      // Keep showing progress; polling will settle the state.
    }
  }, [classroomId, fetchToday, router]);

  const checkAgain = useCallback(() => {
    setElapsed(0);
    setPhase("composing");
  }, []);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) {
      return;
    }
    autoStartedRef.current = true;
    const frame = requestAnimationFrame(() => {
      if (bankSize > 0) {
        void start();
      }
      router.replace(`/classrooms/${classroomId}`);
    });
    return () => cancelAnimationFrame(frame);
  }, [autoStart, bankSize, classroomId, router, start]);

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (phase === "composing" || phase === "posting") {
        minimize();
        return;
      }
      close();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const composing = phase === "posting" || phase === "composing";
  const timedOut = composing && elapsed >= TIMEOUT_SECONDS;
  const stepIndex = step === "running" ? 1 : 0;

  const steps = [
    { key: "queued", label: t("stepQueued") },
    { key: "writing", label: t("stepWriting") },
    { key: "ready", label: t("stepReady") },
  ];

  const inlineProgress = (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        {phase === "posting" ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : step === "running" ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
        )}
        {phase === "posting" || step === "pending" ? t("stepQueued") : t("stepWriting")}
      </button>
      <button
        type="button"
        onClick={cancel}
        className="ml-auto text-xs text-muted-foreground underline hover:text-foreground"
      >
        {tCommon("cancel")}
      </button>
    </div>
  );

  return (
    <>
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeQuizId ? t("ready") : t("idle")}
          </p>
        </div>
        <div>
          {activeQuizId ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild>
                  <Link href={`/classrooms/${classroomId}/quiz/${activeQuizId}`}>
                    {t("takeToday")}
                  </Link>
                </Button>
                <Button variant="outline" onClick={start} disabled={composing}>
                  {t("createNow")}
                </Button>
              </div>
              {composing && minimized ? inlineProgress : null}
            </div>
          ) : bankSize === 0 ? (
            <div className="space-y-2">
              <Button disabled>{t("createNow")}</Button>
              <p className="text-xs text-muted-foreground">
                <Link
                  className="underline hover:text-foreground"
                  href={`/classrooms/${classroomId}/upload`}
                >
                  {t("addNotes")}
                </Link>{" "}
                {t("addNotesSuffix")}
              </p>
            </div>
          ) : composing && minimized ? (
            inlineProgress
          ) : (
            <Button onClick={start} disabled={phase === "posting"}>
              {t("createNow")}
            </Button>
          )}
        </div>
      </div>

      {showModal ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 motion-reduce:transition-none",
            entered && !closing ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("creatingAria")}
            tabIndex={-1}
            onKeyDown={onDialogKeyDown}
            className={cn(
              "w-full max-w-sm rounded-xl bg-card p-6 shadow-xl outline-none transition-all duration-200 motion-reduce:transition-none",
              entered && !closing ? "scale-100 opacity-100" : "scale-95 opacity-0",
            )}
          >
            {composing && !timedOut ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold" aria-live="polite">
                    {phase === "posting" ? t("stepQueued") : steps[stepIndex]?.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {elapsed < 10
                      ? t("hintFewSeconds")
                      : elapsed < 30
                        ? t("hintLonger")
                        : t("hintAlmost")}
                  </p>
                </div>
                <ol className="space-y-2">
                  {steps.map((entry, index) => {
                    const done = index < stepIndex;
                    const current = index === stepIndex;
                    return (
                      <li key={entry.key} className="flex items-center gap-2 text-sm">
                        {done ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            ✓
                          </span>
                        ) : current ? (
                          <Spinner className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-border" />
                        )}
                        <span
                          className={
                            current ? "font-medium text-foreground" : "text-muted-foreground"
                          }
                        >
                          {entry.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <div className="flex justify-between gap-2 pt-1">
                  <Button variant="outline" onClick={minimize}>
                    {t("minimize")}
                  </Button>
                  <Button variant="ghost" onClick={cancel}>
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            ) : phase === "ready" && readyQuizId ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{t("readyTitle")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("knowledgePoints", { count: bankSize })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={`/classrooms/${classroomId}/quiz/${readyQuizId}`}>
                      {t("take")}
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={start}>
                    {t("createAnother")}
                  </Button>
                </div>
                <div className="pt-1">
                  <Button variant="ghost" onClick={close}>
                    {t("close")}
                  </Button>
                </div>
              </div>
            ) : timedOut ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{t("timeoutTitle")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("timeoutBlurb")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={checkAgain}>{t("checkAgain")}</Button>
                  <Button variant="ghost" onClick={close}>
                    {t("close")}
                  </Button>
                </div>
              </div>
            ) : phase === "stopped" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{t("stoppedTitle")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("stoppedBlurb")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={start}>{t("createNow")}</Button>
                  <Button variant="ghost" onClick={close}>
                    {t("close")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{t("failedTitle")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("failedBlurb")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={start}>{t("tryAgain")}</Button>
                  <Button variant="ghost" onClick={close}>
                    {t("close")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
