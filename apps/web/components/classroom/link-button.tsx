import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/components/ui";

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: LinkButtonProps) {
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-700",
    secondary: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
    ghost: "text-neutral-700 hover:bg-neutral-100",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
