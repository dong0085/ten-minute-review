import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ActivityStats, AttemptScore, LearningStats, RecentMiss } from "@tmr/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDurationMs } from "@/lib/format";

function percent(correct: number, answered: number): number {
  return answered > 0 ? Math.round((correct / answered) * 100) : 0;
}

export async function AccountStats({
  activity,
  learning,
  attempts,
  misses,
}: {
  activity: ActivityStats;
  learning: LearningStats;
  attempts: AttemptScore[];
  misses: RecentMiss[];
}) {
  const t = await getTranslations("Account.Stats");
  const categoryT = await getTranslations("Category");
  const locale = await getLocale();

  if (activity.attemptCount === 0) {
    return (
      <Card className="border-primary/10 bg-card/75">
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/classrooms">{t("goToClassrooms")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tiles = [
    { label: t("quizzesTaken"), value: String(activity.quizCount) },
    { label: t("questionsAnswered"), value: String(activity.answeredCount) },
    { label: t("accuracy"), value: `${percent(activity.correctCount, activity.answeredCount)}%` },
    { label: t("timeStudied"), value: formatDurationMs(activity.totalDurationMs, locale) },
    { label: t("activeDays"), value: String(activity.activeDays) },
  ];

  const categories = [...learning.categories].sort(
    (a, b) => percent(a.correct, a.answered) - percent(b.correct, b.answered),
  );

  const trendPoints = attempts
    .map((attempt, index) => {
      const x = attempts.length === 1 ? 0 : (index / (attempts.length - 1)) * 100;
      const ratio = attempt.questionCount > 0 ? attempt.correctCount / attempt.questionCount : 0;
      const y = 28 - ratio * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      <Card className="bg-card/75">
        <CardContent>
          <h2 className="font-heading text-xl font-semibold">{t("activityTitle")}</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-xl border border-border/60 bg-muted/25 px-3 py-3">
                <dd className="font-heading text-2xl font-semibold tabular-nums text-primary">
                  {tile.value}
                </dd>
                <dt className="mt-0.5 text-xs text-muted-foreground">{tile.label}</dt>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="bg-card/75">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-semibold">{t("learningTitle")}</h2>
            {attempts.length >= 2 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t("trend", { count: attempts.length })}</span>
                <svg
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                  className="h-8 w-24 text-foreground"
                  aria-hidden="true"
                >
                  <polyline
                    points={trendPoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">{t("categoryTitle")}</h3>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              categories.map((category) => {
                const accuracy = percent(category.correct, category.answered);
                return (
                  <div key={category.category}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{categoryT(category.category)}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("categoryMeta", {
                          correct: category.correct,
                          answered: category.answered,
                        })}
                        {" · "}
                        {accuracy}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {learning.gaps.length > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("notPracticed", {
                categories: learning.gaps.map((gap) => categoryT(gap)).join(", "),
              })}
            </p>
          ) : null}

          {learning.bankPoints > 0 ? (
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
              <p>
                {t("mastered", {
                  mastered: learning.masteredPoints,
                  total: learning.bankPoints,
                })}
              </p>
              <p>
                {t("practiced", {
                  practiced: learning.practicedPoints,
                  total: learning.bankPoints,
                })}
              </p>
            </div>
          ) : null}

          {misses.length > 0 ? (
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="text-xs font-medium text-muted-foreground">{t("recentMisses")}</h3>
              <ul className="mt-2 space-y-2">
                {misses.map((miss) => (
                  <li key={miss.knowledgePointId} className="flex items-start gap-2 text-sm">
                    <Badge variant="secondary">{categoryT(miss.category)}</Badge>
                    <span className="text-muted-foreground">{miss.stem}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
