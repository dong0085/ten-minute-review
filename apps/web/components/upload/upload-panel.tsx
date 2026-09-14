"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { MAX_IMAGE_BYTES } from "@tmr/core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILES = 10;

type ExtractionStatus = "pending" | "running" | "done" | "failed";

type UploadRow = {
  id: string;
  kind: "text" | "image";
  textContent: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  byteSize: number | null;
  extractionStatus: ExtractionStatus;
  extractedAt: string | null;
  extractionError: string | null;
  subject: string | null;
  discardedCount: number;
  createdAt: string;
  imageUrl: string | null;
};

const fileInputClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground focus:border-ring dark:bg-input/30";

async function readError(response: Response): Promise<string | null> {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string") {
      return message;
    }
  }
  return null;
}

function firstLine(value: string | null, fallback: string): string {
  const line = (value ?? "").split("\n").find((entry) => entry.trim() !== "");
  return line?.trim() ?? fallback;
}

function StatusBadge({ status }: { status: ExtractionStatus }) {
  const t = useTranslations("Upload.Panel");
  if (status === "done") {
    return <Badge variant="success">{t("processed")}</Badge>;
  }
  if (status === "failed") {
    return <Badge variant="destructive">{t("failed")}</Badge>;
  }
  if (status === "running") {
    return <Badge variant="warning">{t("reading")}</Badge>;
  }
  return <Badge variant="warning">{t("queued")}</Badge>;
}

export function UploadPanel({ classroomId }: { classroomId: string }) {
  const t = useTranslations("Upload.Panel");
  const tCommon = useTranslations("Common");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [bankBefore, setBankBefore] = useState<number | null>(null);
  const [bankAfter, setBankAfter] = useState<number | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const loadUploads = useCallback(async () => {
    const response = await fetch(`/api/classrooms/${classroomId}/uploads`);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { uploads: UploadRow[] };
    return data.uploads;
  }, [classroomId]);

  const loadBankTotal = useCallback(async () => {
    const response = await fetch(`/api/classrooms/${classroomId}/bank`);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { total: number };
    return data.total;
  }, [classroomId]);

  useEffect(() => {
    void loadBankTotal().then((total) => {
      if (total !== null) {
        setBankBefore((current) => current ?? total);
      }
    });
  }, [loadBankTotal]);

  const sessionUploads = uploads.filter((upload) => sessionIds.includes(upload.id));
  const processing = sessionUploads.some(
    (upload) => upload.extractionStatus === "pending" || upload.extractionStatus === "running",
  );
  const pointsDelta =
    bankBefore !== null && bankAfter !== null ? Math.max(0, bankAfter - bankBefore) : null;

  useEffect(() => {
    if (!processing) {
      return;
    }
    const interval = setInterval(() => {
      void loadUploads().then((rows) => {
        if (rows) {
          setUploads(rows);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [processing, loadUploads]);

  useEffect(() => {
    if (sessionIds.length === 0 || processing || bankAfter !== null || bankBefore === null) {
      return;
    }
    void loadBankTotal().then((total) => {
      if (total !== null) {
        setBankAfter(total);
      }
    });
  }, [sessionIds.length, processing, bankAfter, bankBefore, loadBankTotal]);

  const refresh = async () => {
    const rows = await loadUploads();
    if (rows) {
      setUploads(rows);
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = Array.from(event.target.files ?? []);
    const next = [...files];
    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setFileError(t("notImage", { name: file.name }));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setFileError(t("tooLarge", { name: file.name }));
        continue;
      }
      if (next.length >= MAX_FILES) {
        setFileError(t("tooMany", { max: MAX_FILES }));
        break;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) {
      setFormError(t("emptyForm"));
      return;
    }
    setSubmitting(true);
    const before = bankBefore ?? (await loadBankTotal());
    if (before !== null) {
      setBankBefore(before);
    }
    setBankAfter(null);
    const ids: string[] = [];
    try {
      if (trimmed) {
        const response = await fetch(`/api/classrooms/${classroomId}/uploads`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });
        if (!response.ok) {
          throw new Error((await readError(response)) ?? t("couldNotSaveNotes"));
        }
        const data = (await response.json()) as { uploadIds: string[] };
        ids.push(...data.uploadIds);
      }
      if (files.length > 0) {
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file);
        }
        const response = await fetch(`/api/classrooms/${classroomId}/uploads`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error((await readError(response)) ?? t("couldNotSaveImages"));
        }
        const data = (await response.json()) as { uploadIds: string[] };
        ids.push(...data.uploadIds);
      }
      setSessionIds(ids);
      setText("");
      setFiles([]);
      setFileInputKey((key) => key + 1);
      const rows = await loadUploads();
      setUploads(rows ?? []);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : tCommon("genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>{t("pasteLabel")}</Label>
            <Textarea
              rows={8}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("pastePlaceholder")}
            />
          </div>
          <div>
            <Label>{t("attachImages")}</Label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className={fileInputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("upToImages", { max: MAX_FILES })}
            </p>
            {fileError ? <p className="mt-2 text-sm text-destructive">{fileError}</p> : null}
            {files.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                    >
                      {t("remove")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? t("savingNotes") : t("uploadNotes")}
          </Button>
          </form>
        </CardContent>
      </Card>
      {sessionIds.length > 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                {processing ? t("readingNotes") : t("processingFinished")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {processing ? t("processingBlurb") : t("finishedBlurb")}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              {t("checkStatus")}
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {sessionUploads.length === 0 ? (
              <li className="text-sm text-muted-foreground">{t("waiting")}</li>
            ) : null}
            {sessionUploads.map((upload) => {
              const showPoints =
                pointsDelta !== null &&
                upload.extractionStatus === "done" &&
                sessionUploads.length === 1;
              return (
                <li key={upload.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm">
                      {upload.subject ??
                        (upload.kind === "image"
                          ? (upload.originalFilename ?? t("image"))
                          : firstLine(upload.textContent, t("textNotes")))}
                    </p>
                    <StatusBadge status={upload.extractionStatus} />
                  </div>
                  {upload.extractionStatus === "done" ? (
                    <p className="mt-2 text-sm text-success">
                      {showPoints ? t("pointsPrefix", { points: pointsDelta }) : ""}
                      {t("linesSkipped", { count: upload.discardedCount })}
                    </p>
                  ) : null}
                  {upload.extractionStatus === "failed" ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-destructive">
                        {upload.extractionError ?? t("extractionFailed")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("keptBlurb")}</p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {!processing && pointsDelta !== null && sessionUploads.length > 1 ? (
            <p className="mt-3 text-sm text-success">
              {t("pointsAdded", { count: pointsDelta })}
            </p>
          ) : null}
          <div className="mt-4 text-sm">
            <Link
              className="text-muted-foreground underline hover:text-foreground"
              href={`/classrooms/${classroomId}/history`}
            >
              {t("viewHistory")}
            </Link>
          </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
