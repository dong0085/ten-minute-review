import { getTranslations } from "next-intl/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SignUpForm } from "@/components/auth/signup-form";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = first(params.code) ?? "";
  const error = first(params.error);
  const t = await getTranslations("Auth.SignUpPage");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {error === "invite" ? (
        <Alert variant="destructive">
          <AlertDescription>{t("inviteError")}</AlertDescription>
        </Alert>
      ) : null}
      <SignUpForm initialCode={code} />
    </div>
  );
}
