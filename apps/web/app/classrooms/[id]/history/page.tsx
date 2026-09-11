import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassroom, listUploadsForUser } from "@tmr/db";
import { Alert, Badge, Card } from "@/components/ui";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { objectUrl } from "@/lib/storage";

function firstLine(value: string | null): string {
  const line = (value ?? "").split("\n").find((entry) => entry.trim() !== "");
  return line?.trim() ?? "Text notes";
}

function formatWhen(value: Date): string {
  return value.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "done") {
    return <Badge tone="green">Processed</Badge>;
  }
  if (status === "failed") {
    return <Badge tone="red">Failed</Badge>;
  }
  return <Badge tone="amber">{status === "running" ? "Reading" : "Queued"}</Badge>;
}

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();
  const classroom = await getClassroom(db, user.id, id);
  if (!classroom) {
    notFound();
  }
  const rows = await listUploadsForUser(db, user.id, id);
  const uploads = await Promise.all(
    rows.map(async ({ upload }) => ({
      upload,
      imageUrl:
        upload.kind === "image" && upload.storageKey
          ? await objectUrl(upload.storageKey).catch(() => null)
          : null,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            className="text-sm text-neutral-600 hover:text-neutral-900"
            href={`/classrooms/${id}`}
          >
            ← {classroom.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Upload history</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Everything you have fed into this classroom, newest first.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          href={`/classrooms/${id}/upload`}
        >
          Add notes
        </Link>
      </div>
      {uploads.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No uploads yet. Add your first notes and they will show up here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {uploads.map(({ upload, imageUrl }) => {
            const src = imageUrl;
            const skipped = upload.discarded.length;
            return (
              <details
                key={upload.id}
                className="rounded-xl border border-neutral-200 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {upload.kind === "image"
                          ? (upload.originalFilename ?? "Image")
                          : firstLine(upload.textContent)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatWhen(upload.createdAt)} ·{" "}
                        {upload.kind === "image" ? "Image" : "Text"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {skipped > 0 ? (
                      <span className="text-xs text-neutral-500">
                        {skipped} {skipped === 1 ? "line" : "lines"} skipped
                      </span>
                    ) : null}
                    <StatusBadge status={upload.extractionStatus} />
                  </div>
                </summary>
                <div className="border-t border-neutral-200 p-4">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={upload.originalFilename ?? "Uploaded note"}
                      className="max-h-96 rounded-lg border border-neutral-200 object-contain"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-neutral-700">
                      {upload.textContent}
                    </p>
                  )}
                  {skipped > 0 ? (
                    <p className="mt-3 text-xs text-neutral-500">
                      {skipped} {skipped === 1 ? "line was" : "lines were"} skipped during
                      extraction.
                    </p>
                  ) : null}
                  {upload.extractionError ? (
                    <div className="mt-3">
                      <Alert tone="error">{upload.extractionError}</Alert>
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
