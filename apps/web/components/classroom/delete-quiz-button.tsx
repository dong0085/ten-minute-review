"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function DeleteQuizButton({ quizId }: { quizId: string }) {
  const t = useTranslations("Classroom.QuizzesPage");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(t("deleteConfirm"))) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(t("deleteError"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("deleteError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => void remove()}
      >
        {pending ? t("deleting") : t("deleteQuiz")}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
