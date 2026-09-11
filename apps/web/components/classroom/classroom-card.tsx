import Link from "next/link";
import type { Classroom } from "@tmr/db";
import { languageName } from "@tmr/core";
import { Badge, Card } from "@/components/ui";
import { LinkButton } from "./link-button";

export function isClassroomDormant(activeUntil: Date): boolean {
  return activeUntil.getTime() < Date.now();
}

export function ClassroomCard({
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
  const target = languageName(classroom.targetLanguage) ?? classroom.targetLanguage;
  const native = languageName(classroom.nativeLanguage) ?? classroom.nativeLanguage;

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
          {dormant ? "Dormant" : "Active"}
        </Badge>
      </div>
      <p className="text-sm text-neutral-600">
        {bankSize} knowledge point{bankSize === 1 ? "" : "s"} in the bank
      </p>
      <div>
        {todayQuizId ? (
          <LinkButton href={`/classrooms/${classroom.id}/quiz/${todayQuizId}`}>
            Take today&apos;s quiz
          </LinkButton>
        ) : (
          <LinkButton href={`/classrooms/${classroom.id}/upload`} variant="secondary">
            Add notes
          </LinkButton>
        )}
      </div>
    </Card>
  );
}
