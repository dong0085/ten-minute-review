"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Palette } from "lucide-react";
import { THEME_SWATCHES, UI_THEMES, type UiTheme } from "@tmr/core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UI_THEME_COOKIE } from "@/lib/theme";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Writes the cookie and swaps data-theme on <html> in place, so the palette
 * changes without waiting on a round trip. The refresh then lets the server
 * render agree with what is already on screen.
 */
export function ThemeSwitcher({ currentTheme }: { currentTheme: UiTheme }) {
  const t = useTranslations("Layout");
  const router = useRouter();
  const [picked, setPicked] = useState<UiTheme | null>(null);
  const [pending, startTransition] = useTransition();
  const activeTheme = picked ?? currentTheme;

  const pick = (theme: UiTheme) => {
    // These browser APIs are the persistence and no-flash mechanism for the picker.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${UI_THEME_COOKIE}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    // eslint-disable-next-line react-hooks/immutability
    document.documentElement.dataset.theme = theme;
    setPicked(theme);
    startTransition(() => router.refresh());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("theme")}
          disabled={pending}
        >
          <Palette />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("theme")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {UI_THEMES.map((theme) => (
          <DropdownMenuItem key={theme} onSelect={() => pick(theme)} className="gap-2">
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/15"
              style={{ backgroundColor: THEME_SWATCHES[theme] }}
            />
            <span className="flex-1">{t(`themeName.${theme}`)}</span>
            {theme === activeTheme ? (
              <Check className="size-3.5 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
