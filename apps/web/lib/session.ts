import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserById } from "@tmr/db";
import { auth } from "./auth";
import { getDb } from "./db";

export const GUEST_COOKIE_NAME = "tmr_guest_id";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const user = await getUserById(getDb(), session.user.id);
  return user ?? null;
}

export async function getCurrentUserOrGuest(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getUserById>>>;
  isGuest: boolean;
} | null> {
  const user = await getSessionUser();
  if (user) {
    return { user, isGuest: Boolean(user.isGuest) };
  }
  try {
    const store = await cookies();
    const guestId = store.get(GUEST_COOKIE_NAME)?.value;
    if (guestId) {
      const guest = await getUserById(getDb(), guestId);
      if (guest && guest.isGuest) {
        return { user: guest, isGuest: true };
      }
    }
  } catch {
    // Ignore when cookies() cannot be accessed
  }
  return null;
}

export async function requireUser(options?: { allowGuest?: boolean }) {
  if (options?.allowGuest) {
    const current = await getCurrentUserOrGuest();
    if (current) {
      return current.user;
    }
    redirect("/signin");
  }
  const user = await getSessionUser();
  if (!user) {
    redirect("/signin");
  }
  return user;
}
