"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Label } from "@/components/ui";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900 disabled:bg-neutral-100";

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

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function EmailPreferencesForm({
  defaultDailyEnabled,
  defaultSendHourLocal,
  unsubscribedAt,
}: {
  defaultDailyEnabled: boolean;
  defaultSendHourLocal: number;
  unsubscribedAt: string | null;
}) {
  const t = useTranslations("Account.EmailPreferencesForm");
  const tc = useTranslations("Common");
  const [dailyEnabled, setDailyEnabled] = useState(defaultDailyEnabled);
  const [sendHourLocal, setSendHourLocal] = useState(defaultSendHourLocal);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setDailyEnabled(defaultDailyEnabled);
    setSendHourLocal(defaultSendHourLocal);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch("/api/me/email-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dailyEnabled, sendHourLocal }),
      });
      if (!response.ok) {
        throw new Error((await readError(response)) ?? t("error"));
      }
      setSaved(true);
      setEditing(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="mt-3 space-y-4">
        {unsubscribedAt ? <Alert>{t("unsubscribed")}</Alert> : null}
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-neutral-500">{t("dailyLabel")}</dt>
            <dd className="mt-0.5 font-medium">{dailyEnabled ? t("on") : t("off")}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">{t("sendHour")}</dt>
            <dd className="mt-0.5 font-medium">{formatHour(sendHourLocal)}</dd>
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
      {unsubscribedAt ? <Alert>{t("unsubscribed")}</Alert> : null}
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={dailyEnabled}
          onChange={(event) => setDailyEnabled(event.target.checked)}
          className="h-4 w-4 accent-neutral-900"
        />
        <span>{t("dailyToggle")}</span>
      </label>
      <div className="max-w-xs">
        <Label>{t("sendHour")}</Label>
        <select
          value={sendHourLocal}
          onChange={(event) => setSendHourLocal(Number(event.target.value))}
          className={selectClass}
          disabled={!dailyEnabled}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>
              {formatHour(hour)}
            </option>
          ))}
        </select>
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
