import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getSessionUser();
  const t = await getTranslations("Home");
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("description")}</p>
      <div className="mt-8 flex justify-center gap-3">
        {user ? (
          <Button asChild size="lg">
            <Link href="/classrooms">{t("goToClassrooms")}</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link href="/signup">{t("createAccount")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signin">{t("signIn")}</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
