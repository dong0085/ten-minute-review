import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getSessionUser();
  const t = await getTranslations("Home");
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-4 text-neutral-600">{t("description")}</p>
      <div className="mt-8 flex justify-center gap-3">
        {user ? (
          <Link
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
            href="/classrooms"
          >
            {t("goToClassrooms")}
          </Link>
        ) : (
          <>
            <Link
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
              href="/signup"
            >
              {t("createAccount")}
            </Link>
            <Link
              className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-100"
              href="/signin"
            >
              {t("signIn")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
