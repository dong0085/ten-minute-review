import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getClassroom } from "@tmr/db";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isClassroomDormant } from "@/components/classroom/classroom-card";
import { ClassroomTabs } from "@/components/classroom/classroom-tabs";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function ClassroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const t = await getTranslations("Classroom.Layout");
  const classroom = await getClassroom(getDb(), user.id, id);
  if (!classroom) {
    notFound();
  }
  const dormant = isClassroomDormant(classroom.activeUntil);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{classroom.name}</h1>
      {dormant ? (
        <Alert>
          <AlertDescription>{t("dormant")}</AlertDescription>
        </Alert>
      ) : null}
      <ClassroomTabs classroomId={classroom.id} />
      {children}
    </div>
  );
}
