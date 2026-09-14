"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ClassroomTabs({ classroomId }: { classroomId: string }) {
  const t = useTranslations("Classroom.Tabs");
  const pathname = usePathname();
  const base = `/classrooms/${classroomId}`;
  const tabs = [
    { label: t("home"), href: base },
    { label: t("upload"), href: `${base}/upload` },
    { label: t("history"), href: `${base}/history` },
    { label: t("quizzes"), href: `${base}/quizzes` },
    { label: t("settings"), href: `${base}/settings` },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
