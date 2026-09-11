"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";

export function ClassroomDangerZone({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"archive" | "delete" | null>(null);

  async function archive() {
    if (!window.confirm("Archive this classroom? Emails stop, and it leaves your list.")) {
      return;
    }
    setPending("archive");
    setError(null);
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/archive`, {
        method: "POST",
      });
      if (!response.ok) {
        setError("Could not archive this classroom. Please try again.");
        return;
      }
      router.push("/classrooms");
      router.refresh();
    } catch {
      setError("Could not archive this classroom. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    const confirmed = window.confirm(
      "Delete this classroom? Its uploads, question bank, and quizzes will be lost. This cannot be undone.",
    );
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
        setError("Could not delete this classroom. Please try again.");
        return;
      }
      router.push("/classrooms");
      router.refresh();
    } catch {
      setError("Could not delete this classroom. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Archive or delete</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Archiving hides the classroom and stops its emails. Deleting removes everything in it.
        </p>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={pending !== null} onClick={() => void archive()}>
          {pending === "archive" ? "Archiving..." : "Archive classroom"}
        </Button>
        <Button variant="danger" disabled={pending !== null} onClick={() => void remove()}>
          {pending === "delete" ? "Deleting..." : "Delete classroom"}
        </Button>
      </div>
    </Card>
  );
}
