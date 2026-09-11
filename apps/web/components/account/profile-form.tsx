"use client";

import { useState, type FormEvent } from "react";
import { LANGUAGES } from "@tmr/core";
import { Alert, Button, Input, Label } from "@/components/ui";

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
  const [username, setUsername] = useState(defaultUsername ?? "");
  const [uiLanguage, setUiLanguage] = useState(defaultUiLanguage);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error((await readError(response)) ?? "Could not save your profile.");
      }
      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Username</Label>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="How your name shows up"
          />
        </div>
        <div>
          <Label>Interface language</Label>
          <select
            value={uiLanguage}
            onChange={(event) => setUiLanguage(event.target.value)}
            className={selectClass}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Timezone</Label>
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
      {saved ? <Alert tone="success">Profile saved.</Alert> : null}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
