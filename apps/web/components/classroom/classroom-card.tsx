import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Classroom } from "@tmr/db";
import { Badge, Card } from "@/components/ui";
import { languageLabel } from "@/lib/language-label";
import { LinkButton } from "./link-button";

export function isClassroomDormant(activeUntil: Date): boolean {
  return activeUntil.getTime() < Date.now();
}

export async function ClassroomCard({
  classroom,
  bankSize,
  todayQuizId,
  dormant,
}: {
  classroom: Classroom;
  bankSize: number;
  todayQuizId: string | null;
  dormant: boolean;
}) {
  const t = await getTranslations("Classroom.Card");
  const locale = await getLocale();
  const target = languageLabel(classroom.targetLanguage, locale);
  const native = languageLabel(classroom.nativeLanguage, locale);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/classrooms/${classroom.id}`}
            className="font-medium hover:underline"
          >
            {classroom.name}
          </Link>
          <p className="mt-1 text-sm text-neutral-500">
            {target} &middot; {native}
          </p>
        </div>
        <Badge tone={dormant ? "amber" : "green"}>
          {dormant ? t("dormant") : t("active")}
        </Badge>
      </div>
      <p className="text-sm text-neutral-600">{t("knowledgePoints", { count: bankSize })}</p>
      <div>
        {todayQuizId ? (
          <LinkButton href={`/classrooms/${classroom.id}/quiz/${todayQuizId}`}>
            {t("takeToday")}
          </LinkButton>
        ) : (
          <LinkButton href={`/classrooms/${classroom.id}/upload`} variant="secondary">
            {t("addNotes")}
          </LinkButton>
        )}
      </div>
    </Card>
  );
}
