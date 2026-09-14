import { cookies } from "next/headers";
import { resolveTheme, UI_THEME_COOKIE } from "./theme";

export async function getTheme() {
  const cookieStore = await cookies();
  return resolveTheme(cookieStore.get(UI_THEME_COOKIE)?.value);
}
