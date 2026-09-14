/**
 * Colour themes. A theme maps to a `data-theme` value on <html>, where the
 * stylesheet turns it into the two numbers every colour token derives from.
 * The first entry is the default for anyone who has not chosen.
 */
export const UI_THEMES = ["mint", "sky", "sakura", "lavender"] as const;

export type UiTheme = (typeof UI_THEMES)[number];

export const DEFAULT_THEME: UiTheme = "mint";

export function isUiTheme(value: string | null | undefined): value is UiTheme {
  return typeof value === "string" && (UI_THEMES as readonly string[]).includes(value);
}

/** Preview colours for the theme picker, matching each palette's primary. */
export const THEME_SWATCHES: Record<UiTheme, string> = {
  mint: "#097c59",
  sky: "#00739c",
  sakura: "#964d72",
  lavender: "#73599d",
};
