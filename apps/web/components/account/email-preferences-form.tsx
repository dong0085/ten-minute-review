"use client";

import { useState, type FormEvent } from "react";
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

export function EmailPreferencesForm({
  defaultDailyEnabled,
  defaultSendHourLocal,
  unsubscribedAt,
}: {
  defaultDailyEnabled: boolean;
  defaultSendHourLocal: number;
  unsubscribedAt: string | null;
}) {
  const [dailyEnabled, setDailyEnabled] = useState(defaultDailyEnabled);
  const [sendHourLocal, setSendHourLocal] = useState(defaultSendHourLocal);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error((await readError(response)) ?? "Could not save your preferences.");
      }
      setSaved(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save your preferences.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4">
      {unsubscribedAt ? (
        <Alert>This address is unsubscribed from all emails.</Alert>
      ) : null}
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={dailyEnabled}
          onChange={(event) => setDailyEnabled(event.target.checked)}
          className="h-4 w-4 accent-neutral-900"
        />
        <span>Send me the daily quiz email</span>
      </label>
      <div className="max-w-xs">
        <Label>Send hour (local time)</Label>
        <select
          value={sendHourLocal}
          onChange={(event) => setSendHourLocal(Number(event.target.value))}
          className={selectClass}
          disabled={!dailyEnabled}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>
              {hour.toString().padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Email preferences saved.</Alert> : null}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
