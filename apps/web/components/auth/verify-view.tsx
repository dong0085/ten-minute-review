"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Alert, Card } from "@/components/ui";

type VerifyResult = "loading" | "success" | "invalid";

const subscribe = () => () => {};

export function VerifyView() {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => null,
  );
  const [result, setResult] = useState<"success" | "invalid" | null>(null);
  const token = search === null ? "" : new URLSearchParams(search).get("token") ?? "";

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((response) => {
        if (active) {
          setResult(response.ok ? "success" : "invalid");
        }
      })
      .catch(() => {
        if (active) {
          setResult("invalid");
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  const state: VerifyResult =
    search === null ? "loading" : !token ? "invalid" : result ?? "loading";

  if (state === "loading") {
    return (
      <Card>
        <p className="text-sm text-neutral-600">Verifying your email...</p>
      </Card>
    );
  }

  if (state === "invalid") {
    return (
      <Card className="space-y-3">
        <Alert tone="error">This verification link is invalid or has expired.</Alert>
        <p className="text-sm text-neutral-600">
          Sign in to request a new link, or create an account again.
        </p>
        <div className="flex gap-4 text-sm">
          <Link className="font-medium underline" href="/signin">
            Sign in
          </Link>
          <Link className="underline" href="/signup">
            Create account
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <Alert tone="success">Your email is verified.</Alert>
      <Link className="text-sm font-medium underline" href="/signin">
        Sign in
      </Link>
    </Card>
  );
}
