import { isLanguageCode } from "@tmr/core";
import { NewClassroomForm } from "@/components/classroom/new-classroom-form";
import { requireUser } from "@/lib/session";

export default async function NewClassroomPage() {
  const user = await requireUser();
  const defaultNativeLanguage = isLanguageCode(user.uiLanguage) ? user.uiLanguage : "en";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New classroom</h1>
        <p className="mt-1 text-sm text-neutral-600">
          A classroom holds your notes, its question bank, and a daily quiz.
        </p>
      </div>
      <NewClassroomForm defaultNativeLanguage={defaultNativeLanguage} />
    </div>
  );
}
