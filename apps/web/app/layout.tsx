import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { signOut } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "ten-minute-review",
  description: "Your tutoring notes, a ten-minute quiz every morning.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <header className="border-b border-neutral-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-sm font-semibold">
              ten-minute-review
            </Link>
            <div className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link className="text-neutral-600 hover:text-neutral-900" href="/classrooms">
                    Classrooms
                  </Link>
                  <Link className="text-neutral-600 hover:text-neutral-900" href="/account">
                    Account
                  </Link>
                  <span className="hidden text-neutral-400 sm:inline">
                    {user.username ?? user.email}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="text-neutral-600 hover:text-neutral-900" href="/signin">
                    Sign in
                  </Link>
                  <Link
                    className="rounded-lg bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
                    href="/signup"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
