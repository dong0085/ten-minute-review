"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { UI_LOCALES } from "@tmr/core";
import { Alert, Button, Input, Label } from "@/components/ui";
import { languageLabel } from "@/lib/language-label";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900";

function timezoneOptions(current: string): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
    .supportedValuesOf;
  const zones = supported ? supported("timeZone") : [];
  return zones.includes(current) ? zones : [current, ...zones];
}

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

export function ProfileForm({
  defaultUsername,
  defaultUiLanguage,
  defaultTimezone,
}: {
  defaultUsername: string | null;
  defaultUiLanguage: string;
  defaultTimezone: string;
}) {
  const t = useTranslations("Account.ProfileForm");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername ?? "");
  const [uiLanguage, setUiLanguage] = useState(defaultUiLanguage);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setUsername(defaultUsername ?? "");
    setUiLanguage(defaultUiLanguage);
    setTimezone(defaultTimezone);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: username.trim() === "" ? null : username.trim(),
          uiLanguage,
          timezone: timezone.trim() === "" ? "UTC" : timezone.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error((await readError(response)) ?? t("error"));
      }
      setSaved(true);
      setEditing(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="mt-3 space-y-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-neutral-500">{t("username")}</dt>
            <dd className="mt-0.5 font-medium">
              {username.trim() === "" ? t("notSet") : username}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">{t("interfaceLanguage")}</dt>
            <dd className="mt-0.5 font-medium">{languageLabel(uiLanguage, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">{t("timezone")}</dt>
            <dd className="mt-0.5 font-medium">{timezone}</dd>
          </div>
        </dl>
        {saved ? <Alert tone="success">{t("saved")}</Alert> : null}
        <Button
          variant="secondary"
          onClick={() => {
            resetFields();
            setSaved(false);
            setEditing(true);
          }}
        >
          {tc("edit")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("username")}</Label>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={t("usernamePlaceholder")}
          />
        </div>
        <div>
          <Label>{t("interfaceLanguage")}</Label>
          <select
            value={uiLanguage}
            onChange={(event) => setUiLanguage(event.target.value)}
            className={selectClass}
          >
            {UI_LOCALES.map((code) => (
              <option key={code} value={code}>
                {languageLabel(code, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t("timezone")}</Label>
          <select
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className={selectClass}
          >
            {timezoneOptions(timezone).map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? tc("saving") : t("save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            resetFields();
            setEditing(false);
          }}
        >
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}
