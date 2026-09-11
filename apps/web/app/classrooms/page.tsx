import { getTranslations } from "next-intl/server";
import { bankSize, getDailyQuizByClassroomAndDate, listClassrooms } from "@tmr/db";
import {
  ClassroomCard,
  isClassroomDormant,
} from "@/components/classroom/classroom-card";
import { LinkButton } from "@/components/classroom/link-button";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

function localDate(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default async function ClassroomsPage() {
  const user = await requireUser();
  const t = await getTranslations("Classroom.ListPage");
  const db = getDb();
  const classrooms = await listClassrooms(db, user.id);
  const today = localDate(user.timezone);

  const cards = await Promise.all(
    classrooms.map(async (classroom) => {
      const [size, quiz] = await Promise.all([
        bankSize(db, classroom.id),
        getDailyQuizByClassroomAndDate(db, classroom.id, today),
      ]);
      return { classroom, bankSize: size, todayQuizId: quiz?.id ?? null };
    }),
  );

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8 text-center">
        <h1 className="text-2xl font-semibold">{t("emptyTitle")}</h1>
        <p className="text-neutral-600">{t("emptyBlurb")}</p>
        <LinkButton href="/classrooms/new">{t("create")}</LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <LinkButton href="/classrooms/new" size="sm">
          {t("newClassroom")}
        </LinkButton>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ classroom, bankSize: size, todayQuizId }) => (
          <ClassroomCard
            key={classroom.id}
            classroom={classroom}
            bankSize={size}
            todayQuizId={todayQuizId}
            dormant={isClassroomDormant(classroom.activeUntil)}
          />
        ))}
      </div>
    </div>
  );
}
