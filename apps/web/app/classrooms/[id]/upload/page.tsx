import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassroom } from "@tmr/db";
import { UploadPanel } from "@/components/upload/upload-panel";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const classroom = await getClassroom(getDb(), user.id, id);
  if (!classroom) {
    notFound();
  }
  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-neutral-600 hover:text-neutral-900"
          href={`/classrooms/${id}`}
        >
          ← {classroom.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Add notes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paste your session notes or attach photos of your handwriting. Points join the bank as
          soon as extraction finishes.
        </p>
      </div>
      <UploadPanel classroomId={id} />
    </div>
  );
}
