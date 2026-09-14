import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Classroom } from "@tmr/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { languageLabel } from "@/lib/language-label";

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
    <Card>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/classrooms/${classroom.id}`}
              className="font-medium hover:underline"
            >
              {classroom.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {target} &middot; {native}
            </p>
          </div>
          <Badge variant={dormant ? "warning" : "success"}>
            {dormant ? t("dormant") : t("active")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t("knowledgePoints", { count: bankSize })}</p>
        <div className="mt-auto">
          {todayQuizId ? (
            <Button asChild>
              <Link href={`/classrooms/${classroom.id}/quiz/${todayQuizId}`}>
                {t("takeToday")}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={`/classrooms/${classroom.id}/upload`}>{t("addNotes")}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
