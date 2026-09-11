import { redirect } from "next/navigation";
import { getUserById } from "@tmr/db";
import { auth } from "./auth";
import { getDb } from "./db";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const user = await getUserById(getDb(), session.user.id);
  return user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/signin");
  }
  return user;
}
