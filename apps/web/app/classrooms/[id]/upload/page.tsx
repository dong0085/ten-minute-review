import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getClassroom } from "@tmr/db";
import { UploadPanel } from "@/components/upload/upload-panel";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const t = await getTranslations("Classroom.UploadPage");
  const classroom = await getClassroom(getDb(), user.id, id);
  if (!classroom) {
    notFound();
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">{t("kicker")}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em]">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("blurb")}</p>
      </div>
      <UploadPanel classroomId={id} />
    </div>
  );
}
