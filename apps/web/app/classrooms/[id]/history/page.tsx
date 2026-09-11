import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { getClassroom, listUploadsForUser } from "@tmr/db";
import { Alert, Badge, Card } from "@/components/ui";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { objectUrl } from "@/lib/storage";

function firstLine(value: string | null, fallback: string): string {
  const line = (value ?? "").split("\n").find((entry) => entry.trim() !== "");
  return line?.trim() ?? fallback;
}

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const t = await getTranslations("Classroom.HistoryPage");
  const format = await getFormatter();
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

  function statusBadge(status: string) {
    if (status === "done") {
      return <Badge tone="green">{t("statusProcessed")}</Badge>;
    }
    if (status === "failed") {
      return <Badge tone="red">{t("statusFailed")}</Badge>;
    }
    return <Badge tone="amber">{status === "running" ? t("statusReading") : t("statusQueued")}</Badge>;
  }

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
          <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t("blurb")}</p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          href={`/classrooms/${id}/upload`}
        >
          {t("addNotes")}
        </Link>
      </div>
      {uploads.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">{t("empty")}</p>
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
                        {upload.subject ??
                          (upload.kind === "image"
                            ? (upload.originalFilename ?? t("image"))
                            : firstLine(upload.textContent, t("textNotes")))}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {format.dateTime(upload.createdAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}{" "}
                        · {upload.kind === "image" ? t("image") : t("textNotes")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {skipped > 0 ? (
                      <span className="text-xs text-neutral-500">
                        {t("linesSkipped", { count: skipped })}
                      </span>
                    ) : null}
                    {statusBadge(upload.extractionStatus)}
                  </div>
                </summary>
                <div className="border-t border-neutral-200 p-4">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={upload.originalFilename ?? t("imageAlt")}
                      className="max-h-96 rounded-lg border border-neutral-200 object-contain"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-neutral-700">
                      {upload.textContent}
                    </p>
                  )}
                  {skipped > 0 ? (
                    <p className="mt-3 text-xs text-neutral-500">
                      {t("skippedDetail", { count: skipped })}
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
