"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/ui";

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

export function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/me", { method: "DELETE" });
      if (!response.ok) {
        throw new Error((await readError(response)) ?? "Could not delete your account.");
      }
      router.push("/");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Could not delete your account.",
      );
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-600">
          Deleting your account removes your classrooms, uploads, knowledge points, quizzes,
          attempts, and stored images.
        </p>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Delete account
        </Button>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Alert tone="error">
        This removes every classroom, upload, knowledge point, quiz, attempt, and stored image.
        This cannot be undone.
      </Alert>
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" onClick={() => void remove()} disabled={deleting}>
          {deleting ? "Deleting…" : "Yes, delete everything"}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={deleting}>
          Cancel
        </Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
