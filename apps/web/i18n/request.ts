import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { getMessages } from "@tmr/core";
import { resolveLocale, UI_LOCALE_COOKIE } from "@/lib/locale";
import { getSessionUser } from "@/lib/session";

export default getRequestConfig(async () => {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const user = await getSessionUser().catch(() => null);
  const locale = resolveLocale(
    user?.uiLanguage,
    requestHeaders.get("accept-language"),
    cookieStore.get(UI_LOCALE_COOKIE)?.value,
  );
  return {
    locale,
    messages: getMessages(locale),
    timeZone: user?.timezone ?? "UTC",
  };
});
