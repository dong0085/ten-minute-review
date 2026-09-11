"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Alert, Button, Card, Input, Label } from "@/components/ui";
import { GoogleButton } from "./google-button";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError("Email or password is incorrect.");
        return;
      }
      router.push("/classrooms");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-5">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        or
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <GoogleButton label="Sign in with Google" />
      <div className="flex justify-between text-sm text-neutral-600">
        <Link className="underline" href="/forgot">
          Forgot password?
        </Link>
        <Link className="font-medium underline" href="/signup">
          Create account
        </Link>
      </div>
    </Card>
  );
}
