import { getTranslations } from "next-intl/server";
import { VerifyView } from "@/components/auth/verify-view";

export default async function VerifyPage() {
  const t = await getTranslations("Auth.VerifyPage");
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>
      <VerifyView />
    </div>
  );
}
