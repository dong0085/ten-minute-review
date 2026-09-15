"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="border-primary/10 bg-card/80">
      <CardContent className="space-y-5">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="signin-email">{t("email")}</Label>
            <Input
              id="signin-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="signin-password">{t("password")}</Label>
            <Input
              id="signin-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("submitting") : t("submit")}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("or")}
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleButton label={t("google")} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link className="underline" href="/forgot">
            {t("forgot")}
          </Link>
          <Link className="font-medium underline" href="/signup">
            {t("createAccount")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
