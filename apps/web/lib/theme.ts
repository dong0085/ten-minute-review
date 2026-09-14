import { DEFAULT_THEME, isUiTheme, type UiTheme } from "@tmr/core";

export const UI_THEME_COOKIE = "UI_THEME";

export function normalizeTheme(value: string | null | undefined): UiTheme | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return isUiTheme(normalized) ? normalized : null;
}

/**
 * Anyone who has not picked a theme gets the default one, so the first paint
 * is already in the right palette and no client-side switching is needed.
 * Stored on a cookie rather than the user record, so the choice works before
 * sign-in and needs no migration.
 */
export function resolveTheme(cookieTheme: string | null | undefined): UiTheme {
  return normalizeTheme(cookieTheme) ?? DEFAULT_THEME;
}
