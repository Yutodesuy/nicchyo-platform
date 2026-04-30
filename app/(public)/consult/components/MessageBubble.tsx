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
  const isConsultUser = isConsult && role === "user";
  const isConsultAssistant = isConsult && role === "assistant";

  return (
    <div
      className={cn(
        "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
        role === "user"
          ? isConsult
            ? "rounded-tr-md bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm"
            : "rounded-tr-sm bg-amber-500 text-white"
          : isConsult
            ? "rounded-[22px] rounded-tl-md border border-amber-200 bg-[linear-gradient(180deg,#fffaf2_0%,#fff6e8_100%)] text-slate-800 shadow-sm"
            : "rounded-tl-sm border border-amber-100 bg-white text-slate-900",
        isConsultUser ? "ring-1 ring-amber-300/60" : "",
        isConsultAssistant ? "pl-5 pr-5 before:absolute before:bottom-4 before:left-2 before:top-4 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-amber-300 before:to-orange-300 after:absolute after:right-4 after:top-3 after:text-3xl after:leading-none after:text-amber-200/70 after:content-['”']" : "",
        isConsult ? "text-[15px] leading-7 md:text-base" : "",
        className
      )}
    >
      {children}
    </div>
  );
}
