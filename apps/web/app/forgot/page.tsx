import { getTranslations } from "next-intl/server";
import { ForgotForm } from "@/components/auth/forgot-form";

export default async function ForgotPage() {
  const t = await getTranslations("Auth.ForgotPage");
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ForgotForm />
    </div>
  );
}
