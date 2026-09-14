"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LANGUAGES } from "@tmr/core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { languageLabel } from "@/lib/language-label";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition focus:border-ring disabled:opacity-50 dark:bg-input/30";

export function ClassroomSettingsForm({
  classroom,
}: {
  classroom: {
    id: string;
    name: string;
    targetLanguage: string;
    nativeLanguage: string;
    autoStopDays: number;
  };
}) {
  const t = useTranslations("Classroom.SettingsForm");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState(classroom.name);
  const [targetLanguage, setTargetLanguage] = useState(classroom.targetLanguage);
  const [nativeLanguage, setNativeLanguage] = useState(classroom.nativeLanguage);
  const [autoStopDays, setAutoStopDays] = useState(String(classroom.autoStopDays));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function touch() {
    setSaved(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const days = Number(autoStopDays);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      setError(t("daysRange"));
      return;
    }
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(`/api/classrooms/${classroom.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, targetLanguage, nativeLanguage, autoStopDays: days }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? t("error"));
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div>
          <Label>{t("name")}</Label>
          <Input
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              touch();
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{t("learning")}</Label>
            <select
              className={selectClass}
              value={targetLanguage}
              onChange={(event) => {
                setTargetLanguage(event.target.value);
                touch();
              }}
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {languageLabel(language.code, locale)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t("speak")}</Label>
            <select
              className={selectClass}
              value={nativeLanguage}
              onChange={(event) => {
                setNativeLanguage(event.target.value);
                touch();
              }}
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {languageLabel(language.code, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>{t("autoStop")}</Label>
          <Input
            type="number"
            min={1}
            max={90}
            required
            value={autoStopDays}
            onChange={(event) => {
              setAutoStopDays(event.target.value);
              touch();
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("autoStopHelp")}</p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {saved ? (
          <Alert variant="success">
            <AlertDescription>{t("saved")}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : t("saveChanges")}
        </Button>
        </form>
      </CardContent>
    </Card>
  );
}
