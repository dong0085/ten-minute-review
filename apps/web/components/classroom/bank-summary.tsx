import { CATEGORIES, type Category } from "@tmr/core";

const LABELS: Record<Category, string> = {
  vocabulary: "Vocabulary",
  phrase: "Phrases & chunks",
  grammar: "Grammar & structure",
  expression: "Ideas & expression",
  comprehension: "Comprehension",
};

export function BankSummary({
  counts,
}: {
  counts: { category: Category; value: number }[];
}) {
  const values = new Map(counts.map((row) => [row.category, row.value]));
  const total = counts.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Question bank</h2>
        <p className="text-sm text-neutral-600">
          {total === 0
            ? "No knowledge points yet. Add notes to build the bank."
            : `${total} knowledge point${total === 1 ? "" : "s"} ready to draw from.`}
        </p>
      </div>
      <dl className="divide-y divide-neutral-100">
        {CATEGORIES.map((category) => (
          <div key={category} className="flex items-center justify-between py-2 text-sm">
            <dt className="text-neutral-600">{LABELS[category]}</dt>
            <dd className="font-medium">{values.get(category) ?? 0}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
