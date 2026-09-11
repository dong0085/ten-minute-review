"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export function ForgotForm() {
  const t = useTranslations("Auth.ForgotForm");
  const tc = useTranslations("Common");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError(tc("genericError"));
        return;
      }
      setDone(true);
    } catch {
      setError(tc("genericError"));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Card className="space-y-3">
        <Alert tone="success">{t("sent")}</Alert>
        <Link className="text-sm font-medium underline" href="/signin">
          {t("back")}
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={onSubmit}>
        <p className="text-sm text-neutral-600">{t("intro")}</p>
        <div>
          <Label>{tc("email")}</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("sending") : t("submit")}
        </Button>
        <p className="text-center text-sm text-neutral-600">
          <Link className="underline" href="/signin">
            {t("back")}
          </Link>
        </p>
      </form>
    </Card>
  );
}
