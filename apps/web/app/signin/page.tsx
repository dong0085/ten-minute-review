import { getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui";
import { SignInForm } from "@/components/auth/signin-form";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const verified = first(params.verified) === "1";
  const error = first(params.error);
  const t = await getTranslations("Auth.SignInPage");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("subtitle")}</p>
      </div>
      {verified ? <Alert tone="success">{t("verified")}</Alert> : null}
      {error ? (
        <Alert tone="error">{error === "invite" ? t("inviteError") : t("signInError")}</Alert>
      ) : null}
      <SignInForm />
    </div>
  );
}
