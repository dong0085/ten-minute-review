export const LANGUAGES = [
  { code: "zh", name: "Mandarin" },
  { code: "es", name: "Spanish" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "pt", name: "Portuguese" },
  { code: "bn", name: "Bengali" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "vi", name: "Vietnamese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value);
}

export function languageName(code: string): string | null {
  return LANGUAGES.find((language) => language.code === code)?.name ?? null;
}
