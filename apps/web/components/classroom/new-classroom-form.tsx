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

export function NewClassroomForm({
  defaultNativeLanguage,
}: {
  defaultNativeLanguage: string;
}) {
  const t = useTranslations("Classroom.NewForm");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState(defaultNativeLanguage);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, targetLanguage, nativeLanguage }),
      });
      const body = (await response.json().catch(() => null)) as {
        classroom?: { id?: string };
        error?: string;
      } | null;
      if (response.ok && body?.classroom?.id) {
        router.push(`/classrooms/${body.classroom.id}`);
        router.refresh();
        return;
      }
      setError(body?.error ?? t("error"));
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
        <div>
          <Label>{t("name")}</Label>
          <Input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div>
          <Label>{t("learning")}</Label>
          <select
            className={selectClass}
            required
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
          >
            <option value="" disabled>
              {t("chooseLanguage")}
            </option>
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
            required
            value={nativeLanguage}
            onChange={(event) => setNativeLanguage(event.target.value)}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {languageLabel(language.code, locale)}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("creating") : t("create")}
        </Button>
        </form>
      </CardContent>
    </Card>
  );
}
