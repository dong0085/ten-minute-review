"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@tmr/core";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900";

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
      setError("Choose a number of days between 1 and 90.");
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
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold">Classroom settings</h2>
        <div>
          <Label>Name</Label>
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
            <Label>I&apos;m learning</Label>
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
                  {language.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>I speak</Label>
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
                  {language.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Auto-stop after quiet days</Label>
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
          <p className="mt-1 text-xs text-neutral-500">
            Emails pause after this many days without notes. Opening the classroom resumes them.
          </p>
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {saved ? <Alert tone="success">Saved.</Alert> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
