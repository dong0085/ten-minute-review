import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("Auth.UnsubscribePage");

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("invalidTitle")}</h1>
        <p className="mt-3 text-neutral-600">{t("invalidBody")}</p>
        <Link
          href="/account"
          className="mt-6 inline-block rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          {t("goToAccount")}
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
      <h1 className="text-2xl font-semibold">{t("successTitle")}</h1>
      <p className="mt-3 text-neutral-600">{t("successBody")}</p>
      <Link
        href="/account"
        className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        {t("manage")}
      </Link>
    </div>
  );
}
