"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Alert, Button, Card, Input, Label } from "@/components/ui";
import { GoogleButton } from "./google-button";

export function SignInForm() {
  const t = useTranslations("Auth.SignInForm");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError(t("invalid"));
        return;
      }
      router.push("/classrooms");
      router.refresh();
    } catch {
      setError(tc("genericError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-5">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label>{t("email")}</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <Label>{t("password")}</Label>
          <Input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        {t("or")}
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <GoogleButton label={t("google")} />
      <div className="flex justify-between text-sm text-neutral-600">
        <Link className="underline" href="/forgot">
          {t("forgot")}
        </Link>
        <Link className="font-medium underline" href="/signup">
          {t("createAccount")}
        </Link>
      </div>
    </Card>
  );
}
