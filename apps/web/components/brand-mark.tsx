import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="sr-only">Ten Minutes Review</span>
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-[0.65rem] border border-primary/20 bg-primary/[0.08] font-heading text-[0.95rem] font-semibold tracking-[-0.06em] text-primary transition-transform duration-200 group-hover:-rotate-2"
      >
        10′
      </span>
      <span aria-hidden="true" className="hidden font-heading text-[1.05rem] font-semibold tracking-[-0.025em] sm:inline">
        Ten Minutes Review
      </span>
    </Link>
  );
}
