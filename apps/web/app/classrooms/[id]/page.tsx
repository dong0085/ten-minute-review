import Link from "next/link";
import { notFound } from "next/navigation";
import {
  countBankByCategory,
  getClassroom,
  getQuizByClassroomAndDate,
  listUploadsForUser,
} from "@tmr/db";
import { Badge, Card } from "@/components/ui";
import { BankSummary } from "@/components/classroom/bank-summary";
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export default async function ClassroomHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();
  const classroom = await getClassroom(db, user.id, id);
  if (!classroom) {
    notFound();
  }

  const today = localDate(user.timezone);
  const [counts, quiz, uploads] = await Promise.all([
    countBankByCategory(db, user.id, classroom.id),
    getQuizByClassroomAndDate(db, classroom.id, today),
    listUploadsForUser(db, user.id, classroom.id),
  ]);
  const recent = uploads.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Today&apos;s quiz</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {quiz
                ? "Your quiz for today is ready."
                : "No quiz yet today. It arrives in your morning email."}
            </p>
          </div>
          {quiz ? (
            <div>
              <LinkButton href={`/classrooms/${classroom.id}/quiz/${quiz.id}`}>
                Take today&apos;s quiz
              </LinkButton>
            </div>
          ) : null}
        </Card>
        <Card className="flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Add notes</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Paste your notes or add photos of your handwriting. New material joins the
              question bank.
            </p>
          </div>
          <div>
            <LinkButton href={`/classrooms/${classroom.id}/upload`} variant="secondary">
              Add notes
            </LinkButton>
          </div>
        </Card>
      </div>

      <Card>
        <BankSummary counts={counts} />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent uploads</h2>
          <Link className="text-sm underline" href={`/classrooms/${classroom.id}/history`}>
            View history
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Nothing yet. Add your first notes to get started.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recent.map(({ upload }) => (
              <li key={upload.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {upload.kind === "text"
                      ? upload.textContent?.split("\n")[0] || "Text notes"
                      : upload.originalFilename ?? "Image notes"}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatDate(upload.createdAt)}
                  </p>
                </div>
                <Badge tone="neutral">{upload.kind === "text" ? "Text" : "Image"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
