"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Card } from "@/components/ui";

export function ClassroomDangerZone({ classroomId }: { classroomId: string }) {
  const t = useTranslations("Classroom.DangerZone");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"archive" | "delete" | null>(null);

  async function archive() {
    if (!window.confirm(t("archiveConfirm"))) {
      return;
    }
    setPending("archive");
    setError(null);
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/archive`, {
        method: "POST",
      });
      if (!response.ok) {
        setError(t("archiveError"));
        return;
      }
      router.push("/classrooms");
      router.refresh();
    } catch {
      setError(t("archiveError"));
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    const confirmed = window.confirm(t("deleteConfirm"));
    if (!confirmed) {
      return;
    }
    setPending("delete");
    setError(null);
    try {
      const response = await fetch(`/api/classrooms/${classroomId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(t("deleteError"));
        return;
      }
      router.push("/classrooms");
      router.refresh();
    } catch {
      setError(t("deleteError"));
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t("blurb")}</p>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={pending !== null} onClick={() => void archive()}>
          {pending === "archive" ? t("archiving") : t("archive")}
        </Button>
        <Button variant="danger" disabled={pending !== null} onClick={() => void remove()}>
          {pending === "delete" ? t("deleting") : t("delete")}
        </Button>
      </div>
    </Card>
  );
}
