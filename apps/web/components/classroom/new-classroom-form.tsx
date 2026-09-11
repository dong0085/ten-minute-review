"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@tmr/core";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900";

export function NewClassroomForm({
  defaultNativeLanguage,
}: {
  defaultNativeLanguage: string;
}) {
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
      setError(body?.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label>Name</Label>
          <Input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="French with Marie"
          />
        </div>
        <div>
          <Label>I&apos;m learning</Label>
          <select
            className={selectClass}
            required
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
          >
            <option value="" disabled>
              Choose a language
            </option>
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
            required
            value={nativeLanguage}
            onChange={(event) => setNativeLanguage(event.target.value)}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating..." : "Create classroom"}
        </Button>
      </form>
    </Card>
  );
}
