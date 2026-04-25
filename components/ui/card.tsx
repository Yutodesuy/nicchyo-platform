import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-2xl border bg-white text-slate-900 shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

export const CardWarm = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl border border-amber-100 bg-surface-warmwhite text-slate-900 shadow-card", className)}
      {...props}
    />
  )
);
CardWarm.displayName = "CardWarm";
