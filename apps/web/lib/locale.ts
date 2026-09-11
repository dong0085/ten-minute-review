import { DEFAULT_LOCALE, isUiLocale, type UiLocale } from "@tmr/core";

export function normalizeLocale(value: string | null | undefined): UiLocale | null {
  if (!value) {
    return null;
  }
  const base = value.trim().toLowerCase().split("-")[0] ?? "";
  return isUiLocale(base) ? base : null;
}

export const UI_LOCALE_COOKIE = "NEXT_LOCALE";

export function resolveLocale(
  uiLanguage: string | null | undefined,
  acceptLanguage: string | null | undefined,
  cookieLocale: string | null | undefined = null,
): UiLocale {
  const fromProfile = normalizeLocale(uiLanguage);
  if (fromProfile) {
    return fromProfile;
  }
  const fromCookie = normalizeLocale(cookieLocale);
  if (fromCookie) {
    return fromCookie;
  }
  if (acceptLanguage) {
    for (const tag of parseAcceptLanguage(acceptLanguage)) {
      const locale = normalizeLocale(tag);
      if (locale) {
        return locale;
      }
    }
  }
  return DEFAULT_LOCALE;
}

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qualityParam = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const parsed = qualityParam ? Number.parseFloat(qualityParam.slice(2)) : 1;
      return { tag, quality: Number.isFinite(parsed) ? parsed : 0 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag);
}
