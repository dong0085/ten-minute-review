import Link from "next/link";
import { getSessionUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getSessionUser();
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-semibold">Your notes become a ten-minute quiz</h1>
      <p className="mt-4 text-neutral-600">
        Paste your tutoring notes or photograph your handwriting. Every morning you get a
        quiz drawn from what you actually studied — vocabulary, phrases, grammar, ideas,
        and comprehension.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        {user ? (
          <Link
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
            href="/classrooms"
          >
            Go to my classrooms
          </Link>
        ) : (
          <>
            <Link
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
              href="/signup"
            >
              Create account
            </Link>
            <Link
              className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-100"
              href="/signin"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
