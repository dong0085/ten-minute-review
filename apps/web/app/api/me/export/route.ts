import { NextResponse } from "next/server";
import { exportUserData } from "@tmr/db";
import { handleRouteError, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    const data = await exportUserData(getDb(), user.id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-disposition": 'attachment; filename="ten-minute-review-export.json"',
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
