import { getTranslations } from "next-intl/server";
import { CATEGORIES, type Category } from "@tmr/core";

export async function BankSummary({
  counts,
}: {
  counts: { category: Category; value: number }[];
}) {
  const t = await getTranslations("Classroom.BankSummary");
  const categoryT = await getTranslations("Category");
  const values = new Map(counts.map((row) => [row.category, row.value]));
  const total = counts.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {total === 0 ? t("empty") : t("total", { count: total })}
        </p>
      </div>
      <dl className="divide-y divide-border">
        {CATEGORIES.map((category) => (
          <div key={category} className="flex items-center justify-between py-2 text-sm">
            <dt className="text-muted-foreground">{categoryT(category)}</dt>
            <dd className="font-medium">{values.get(category) ?? 0}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
