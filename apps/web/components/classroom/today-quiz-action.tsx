"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, cn } from "@/components/ui";
import { LinkButton } from "@/components/classroom/link-button";

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

function elapsedHint(seconds: number): string {
  if (seconds < 10) {
    return "This usually takes a few seconds.";
  }
  if (seconds < 30) {
    return "Taking a little longer than usual.";
  }
  return "Almost there.";
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

  const activeQuizId = readyQuizId ?? dailyQuizId;
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
    { key: "queued", label: "Queued" },
    { key: "writing", label: "Writing your quiz" },
    { key: "ready", label: "Ready" },
  ];

  return (
    <>
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Today&apos;s quiz</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {activeQuizId
              ? "Your quiz for today is ready."
              : "Create one now, or wait for your morning email."}
          </p>
        </div>
        <div>
          {activeQuizId ? (
            <LinkButton href={`/classrooms/${classroomId}/quiz/${activeQuizId}`}>
              Take today&apos;s quiz
            </LinkButton>
          ) : bankSize === 0 ? (
            <div className="space-y-2">
              <Button disabled>Create a quiz now</Button>
              <p className="text-xs text-neutral-500">
                <Link
                  className="underline hover:text-neutral-900"
                  href={`/classrooms/${classroomId}/upload`}
                >
                  Add notes
                </Link>{" "}
                to create a quiz.
              </p>
            </div>
          ) : composing && minimized ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="flex items-center gap-2 text-sm font-medium text-neutral-800 hover:text-neutral-950"
              >
                {phase === "posting" ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : step === "running" ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-neutral-400" />
                )}
                {phase === "posting" || step === "pending"
                  ? "Queued"
                  : "Writing your quiz"}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="ml-auto text-xs text-neutral-500 underline hover:text-neutral-900"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button onClick={start} disabled={phase === "posting"}>
              Create a quiz now
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
            aria-label="Creating your quiz"
            tabIndex={-1}
            onKeyDown={onDialogKeyDown}
            className={cn(
              "w-full max-w-sm rounded-xl bg-white p-6 shadow-xl outline-none transition-all duration-200 motion-reduce:transition-none",
              entered && !closing ? "scale-100 opacity-100" : "scale-95 opacity-0",
            )}
          >
            {composing && !timedOut ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold" aria-live="polite">
                    {phase === "posting" ? "Queued" : steps[stepIndex]?.label}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">{elapsedHint(elapsed)}</p>
                </div>
                <ol className="space-y-2">
                  {steps.map((entry, index) => {
                    const done = index < stepIndex;
                    const current = index === stepIndex;
                    return (
                      <li key={entry.key} className="flex items-center gap-2 text-sm">
                        {done ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
                            ✓
                          </span>
                        ) : current ? (
                          <Spinner className="h-3.5 w-3.5 text-neutral-700" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-neutral-300" />
                        )}
                        <span
                          className={
                            current ? "font-medium text-neutral-900" : "text-neutral-500"
                          }
                        >
                          {entry.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <div className="flex justify-between gap-2 pt-1">
                  <Button variant="secondary" onClick={minimize}>
                    Minimize
                  </Button>
                  <Button variant="ghost" onClick={cancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : phase === "ready" && readyQuizId ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Your quiz is ready.</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {bankSize} knowledge point{bankSize === 1 ? "" : "s"} in the bank.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/classrooms/${classroomId}/quiz/${readyQuizId}`}>
                    Take quiz
                  </LinkButton>
                  <Button variant="secondary" onClick={start}>
                    Create another quiz
                  </Button>
                </div>
                <div className="pt-1">
                  <Button variant="ghost" onClick={close}>
                    Close
                  </Button>
                </div>
              </div>
            ) : timedOut ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Still working…</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    It is taking longer than usual. You can wait or check the Quizzes page
                    later.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={checkAgain}>Check again</Button>
                  <Button variant="ghost" onClick={close}>
                    Close
                  </Button>
                </div>
              </div>
            ) : phase === "stopped" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Stopped</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    No quiz was created. You can start again any time.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={start}>Create a quiz now</Button>
                  <Button variant="ghost" onClick={close}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Couldn&apos;t create the quiz.</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Something went wrong while writing it. Try again in a moment.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={start}>Try again</Button>
                  <Button variant="ghost" onClick={close}>
                    Close
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
