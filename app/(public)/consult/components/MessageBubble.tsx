import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

type MessageBubbleProps = {
  role: "user" | "assistant";
  children: ReactNode;
  variant?: "default" | "consult";
  className?: string;
};

export default function MessageBubble({
  role,
  children,
  variant = "default",
  className,
}: MessageBubbleProps) {
  const isConsult = variant === "consult";

  return (
    <div
      className={cn(
        "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
        role === "user"
          ? isConsult
            ? "rounded-tr-sm bg-slate-700 text-white"
            : "rounded-tr-sm bg-amber-500 text-white"
          : isConsult
            ? "rounded-tl-sm border border-[var(--consult-border)] bg-[var(--consult-surface)] text-slate-900"
            : "rounded-tl-sm border border-amber-100 bg-white text-slate-900",
        className
      )}
    >
      {children}
    </div>
  );
}
