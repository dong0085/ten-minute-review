import Link from "next/link";
import { getUserById, upsertEmailPreferences } from "@tmr/db";
import { verifyUnsubscribeToken } from "@tmr/core/node";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const userId = token ? verifyUnsubscribeToken(token, env.authSecret) : null;
  const user = userId ? await getUserById(getDb(), userId) : null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold">This link is invalid or expired</h1>
        <p className="mt-3 text-neutral-600">
          Sign in and open your account to manage email preferences.
        </p>
        <Link
          href="/account"
          className="mt-6 inline-block rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          Go to account
        </Link>
      </div>
    );
  }

  await upsertEmailPreferences(getDb(), user.id, {
    dailyEnabled: false,
    unsubscribedAt: new Date(),
  });

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">You are unsubscribed</h1>
      <p className="mt-3 text-neutral-600">
        Daily quiz emails are off for this account. Your classrooms, quizzes, and history
        are still here whenever you want them.
      </p>
      <Link
        href="/account"
        className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Manage email settings
      </Link>
    </div>
  );
}
