"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Card className="space-y-3">
        <Alert tone="success">
          If an account exists for that email, we sent a reset link.
        </Alert>
        <Link className="text-sm font-medium underline" href="/signin">
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={onSubmit}>
        <p className="text-sm text-neutral-600">
          Enter your email and we will send you a link to reset your password.
        </p>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </Button>
        <p className="text-center text-sm text-neutral-600">
          <Link className="underline" href="/signin">
            Back to sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
