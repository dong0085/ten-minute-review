"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { callbackUrl: "/classrooms" });
      }}
    >
      {pending ? "Redirecting..." : label}
    </Button>
  );
}
