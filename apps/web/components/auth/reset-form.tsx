"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (response.ok) {
        setDone(true);
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "This reset link is invalid or has expired.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Card className="space-y-3">
        <Alert tone="success">Your password has been updated.</Alert>
        <Link className="text-sm font-medium underline" href="/signin">
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label>New password</Label>
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div>
          <Label>Confirm password</Label>
          <Input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving..." : "Set new password"}
        </Button>
      </form>
    </Card>
  );
}
