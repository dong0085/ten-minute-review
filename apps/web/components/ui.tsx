import type {
  ButtonHTMLAttributes,
  ComponentProps,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
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
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-sm font-medium text-neutral-800">{children}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-neutral-200 bg-white p-5", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "error" | "success";
}) {
  const tones = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-800",
  };
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-sm", tones[tone])}>{children}</div>
  );
}
