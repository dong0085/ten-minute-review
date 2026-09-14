import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { signOut } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { getTheme } from "@/lib/theme-server";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Layout");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  const locale = await getLocale();
  const theme = await getTheme();
  const t = await getTranslations("Layout");
  return (
    <html lang={locale} data-theme={theme} className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider>
          <header className="border-b border-border bg-card">
            <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="text-sm font-semibold">
                {t("title")}
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <LanguageSwitcher signedIn={Boolean(user)} />
                <ThemeSwitcher currentTheme={theme} />
                {user ? (
                  <>
                    <Link
                      className="text-muted-foreground hover:text-foreground"
                      href="/classrooms"
                    >
                      {t("classrooms")}
                    </Link>
                    <Link className="text-muted-foreground hover:text-foreground" href="/account">
                      {t("account")}
                    </Link>
                    <span className="hidden text-muted-foreground sm:inline">
                      {user.username ?? user.email}
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                      }}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        {t("signOut")}
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link className="text-muted-foreground hover:text-foreground" href="/signin">
                      {t("signIn")}
                    </Link>
                    <Button asChild size="sm">
                      <Link href="/signup">{t("createAccount")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
