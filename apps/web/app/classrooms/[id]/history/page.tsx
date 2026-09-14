import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { getClassroom, listUploadsForUser } from "@tmr/db";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      return <Badge variant="success">{t("statusProcessed")}</Badge>;
    }
    if (status === "failed") {
      return <Badge variant="destructive">{t("statusFailed")}</Badge>;
    }
    return (
      <Badge variant="warning">{status === "running" ? t("statusReading") : t("statusQueued")}</Badge>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            className="text-sm text-muted-foreground hover:text-foreground"
            href={`/classrooms/${id}`}
          >
            ← {classroom.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("blurb")}</p>
        </div>
        <Button asChild>
          <Link href={`/classrooms/${id}/upload`}>{t("addNotes")}</Link>
        </Button>
      </div>
      {uploads.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {uploads.map(({ upload, imageUrl }) => {
            const src = imageUrl;
            const skipped = upload.discarded.length;
            return (
              <details
                key={upload.id}
                className="rounded-xl border border-border bg-card"
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
                      <p className="text-xs text-muted-foreground">
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
                      <span className="text-xs text-muted-foreground">
                        {t("linesSkipped", { count: skipped })}
                      </span>
                    ) : null}
                    {statusBadge(upload.extractionStatus)}
                  </div>
                </summary>
                <div className="border-t border-border p-4">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={upload.originalFilename ?? t("imageAlt")}
                      className="max-h-96 rounded-lg border border-border object-contain"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {upload.textContent}
                    </p>
                  )}
                  {skipped > 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("skippedDetail", { count: skipped })}
                    </p>
                  ) : null}
                  {upload.extractionError ? (
                    <div className="mt-3">
                      <Alert variant="destructive">
                        <AlertDescription>{upload.extractionError}</AlertDescription>
                      </Alert>
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
