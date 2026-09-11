"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export function ClassroomTabs({ classroomId }: { classroomId: string }) {
  const pathname = usePathname();
  const base = `/classrooms/${classroomId}`;
  const tabs = [
    { label: "Home", href: base },
    { label: "Upload", href: `${base}/upload` },
    { label: "History", href: `${base}/history` },
    { label: "Quizzes", href: `${base}/quizzes` },
    { label: "Settings", href: `${base}/settings` },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition",
              active
                ? "border-neutral-900 font-medium text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
