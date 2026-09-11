import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body = await request.json().catch(() => null);
  return schema.parse(body);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return jsonError(issue?.message ?? "Invalid request", 422);
  }
  console.error(error);
  return jsonError("Something went wrong", 500);
}
