"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Account.DeleteAccount");
  const tc = useTranslations("Common");
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
        throw new Error((await readError(response)) ?? t("error"));
      }
      router.push("/");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("error"));
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-600">{t("description")}</p>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          {t("deleteAccount")}
        </Button>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Alert tone="error">{t("warning")}</Alert>
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" onClick={() => void remove()} disabled={deleting}>
          {deleting ? t("deleting") : t("confirm")}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={deleting}>
          {tc("cancel")}
        </Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
