"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { MAX_IMAGE_BYTES } from "@tmr/core";
import { Alert, Badge, Button, Card, Label, Textarea } from "@/components/ui";

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
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-white focus:border-neutral-900";

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

function firstLine(value: string | null): string {
  const line = (value ?? "").split("\n").find((entry) => entry.trim() !== "");
  return line?.trim() ?? "Text notes";
}

function StatusBadge({ status }: { status: ExtractionStatus }) {
  if (status === "done") {
    return <Badge tone="green">Processed</Badge>;
  }
  if (status === "failed") {
    return <Badge tone="red">Failed</Badge>;
  }
  if (status === "running") {
    return <Badge tone="amber">Reading</Badge>;
  }
  return <Badge tone="amber">Queued</Badge>;
}

export function UploadPanel({ classroomId }: { classroomId: string }) {
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
        setFileError(`${file.name} is not an image file.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setFileError(`${file.name} is larger than 10 MB.`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        setFileError(`You can attach up to ${MAX_FILES} images at once.`);
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
      setFormError("Paste some notes or attach at least one image.");
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
          throw new Error((await readError(response)) ?? "Could not save your notes.");
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
          throw new Error((await readError(response)) ?? "Could not save your images.");
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
      setFormError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Paste or type your notes</Label>
            <Textarea
              rows={8}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={"Paste your session notes here"}
            />
          </div>
          <div>
            <Label>Attach images</Label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className={fileInputClass}
            />
            <p className="mt-1 text-xs text-neutral-500">Up to {MAX_FILES} images, 10 MB each.</p>
            {fileError ? <p className="mt-2 text-sm text-red-700">{fileError}</p> : null}
            {files.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-xs text-neutral-500 hover:text-red-700"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {formError ? <Alert tone="error">{formError}</Alert> : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving notes…" : "Upload notes"}
          </Button>
        </form>
      </Card>
      {sessionIds.length > 0 ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                {processing ? "Reading your notes…" : "Processing finished"}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {processing
                  ? "Extraction runs in the background. You can leave this page or add more notes."
                  : "The upload stays in this classroom for good."}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void refresh()}>
              Check status
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {sessionUploads.length === 0 ? (
              <li className="text-sm text-neutral-500">Waiting for the upload to appear…</li>
            ) : null}
            {sessionUploads.map((upload) => {
              const showPoints =
                pointsDelta !== null &&
                upload.extractionStatus === "done" &&
                sessionUploads.length === 1;
              return (
                <li key={upload.id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm">
                      {upload.subject ??
                        (upload.kind === "image"
                          ? (upload.originalFilename ?? "Image")
                          : firstLine(upload.textContent))}
                    </p>
                    <StatusBadge status={upload.extractionStatus} />
                  </div>
                  {upload.extractionStatus === "done" ? (
                    <p className="mt-2 text-sm text-green-800">
                      {showPoints ? `+${pointsDelta} points, ` : ""}
                      {upload.discardedCount}{" "}
                      {upload.discardedCount === 1 ? "line" : "lines"} skipped
                    </p>
                  ) : null}
                  {upload.extractionStatus === "failed" ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-red-700">
                        {upload.extractionError ?? "Extraction failed."}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Your upload is kept. A retry is automatic, and you can read the material
                        any time in History.
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {!processing && pointsDelta !== null && sessionUploads.length > 1 ? (
            <p className="mt-3 text-sm text-green-800">
              +{pointsDelta} knowledge points added from these uploads.
            </p>
          ) : null}
          <div className="mt-4 text-sm">
            <Link
              className="text-neutral-600 underline hover:text-neutral-900"
              href={`/classrooms/${classroomId}/history`}
            >
              View upload history
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
