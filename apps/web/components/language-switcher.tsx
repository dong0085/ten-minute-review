"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { UI_LOCALES } from "@tmr/core";
import { languageLabel } from "@/lib/language-label";
import { UI_LOCALE_COOKIE } from "@/lib/locale";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageSwitcher({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("Layout");
  const locale = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (next === locale) {
      return;
    }
    setSaving(true);
    try {
      if (signedIn) {
        const response = await fetch("/api/me", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ uiLanguage: next }),
        });
        if (!response.ok) {
          return;
        }
      } else {
        document.cookie = `${UI_LOCALE_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      }
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      aria-label={t("language")}
      className="h-7 rounded-lg border border-input bg-transparent px-2 text-sm text-muted-foreground outline-none transition focus:border-ring disabled:opacity-50 dark:bg-input/30"
      value={locale}
      onChange={handleChange}
      disabled={saving || pending}
    >
      {UI_LOCALES.map((code) => (
        <option key={code} value={code}>
          {languageLabel(code, locale)}
        </option>
      ))}
    </select>
  );
}
