"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { UI_LOCALES } from "@tmr/core";
import { Alert, Button, Card, Input, Label } from "@/components/ui";
import { languageLabel } from "@/lib/language-label";
import { GoogleButton } from "./google-button";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900";

const subscribe = () => () => {};

function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
}

function browserLanguage() {
  const code = navigator.language.slice(0, 2).toLowerCase();
  return UI_LOCALES.some((locale) => locale === code) ? code : "";
}

function writeInviteCookie(code: string) {
  if (code) {
    document.cookie = `tmr_invite=${encodeURIComponent(code)}; path=/; max-age=3600`;
  } else {
    document.cookie = "tmr_invite=; path=/; max-age=0";
  }
}

export function SignUpForm({ initialCode = "" }: { initialCode?: string }) {
  const t = useTranslations("Auth.SignUpForm");
  const locale = useLocale();
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const [timezoneOverride, setTimezoneOverride] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const detectedLanguage = useSyncExternalStore(subscribe, browserLanguage, () => "");
  const detectedTimezone = useSyncExternalStore(subscribe, browserTimezone, () => "");
  const uiLanguage = languageOverride ?? detectedLanguage;
  const timezone = timezoneOverride ?? detectedTimezone;

  useEffect(() => {
    if (initialCode) {
      writeInviteCookie(initialCode);
    }
  }, [initialCode]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          inviteCode: inviteCode || undefined,
          timezone: timezone || undefined,
          uiLanguage: uiLanguage || undefined,
        }),
      });
      if (response.ok) {
        setDone(true);
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 403) {
        setError(t("inviteInvalid"));
      } else if (response.status === 409) {
        setError(t("emailTaken"));
      } else if (body?.error) {
        setError(body.error);
      } else {
        setError(t("genericError"));
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t("checkEmailTitle")}</h2>
        <p className="text-sm text-neutral-600">{t("checkEmailBody", { email })}</p>
        <Link className="text-sm font-medium underline" href="/signin">
          {t("goToSignIn")}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label>{t("inviteCode")}</Label>
          <Input
            value={inviteCode}
            onChange={(event) => {
              setInviteCode(event.target.value);
              writeInviteCookie(event.target.value);
            }}
            placeholder={t("invitePlaceholder")}
            autoComplete="off"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{t("language")}</Label>
            <select
              className={selectClass}
              value={uiLanguage}
              onChange={(event) => setLanguageOverride(event.target.value)}
            >
              <option value="">{t("browserDefault")}</option>
              {UI_LOCALES.map((code) => (
                <option key={code} value={code}>
                  {languageLabel(code, locale)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t("timezone")}</Label>
            <Input
              value={timezone}
              onChange={(event) => setTimezoneOverride(event.target.value)}
              placeholder="America/New_York"
            />
          </div>
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("creating") : t("createAccount")}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        {t("or")}
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <GoogleButton label={t("google")} />
      <p className="text-center text-sm text-neutral-600">
        {t("alreadyHave")}{" "}
        <Link className="font-medium underline" href="/signin">
          {t("signIn")}
        </Link>
      </p>
    </Card>
  );
}
