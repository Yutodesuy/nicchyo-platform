import React from "react";

type Status =
  | "active"
  | "pending"
  | "suspended"
  | "rejected"
  | "approved"
  | "reported"
  | "published"
  | "flagged"
  | "hidden"
  | "deleted";

interface StatusBadgeProps {
  status: Status;
  customLabel?: string;
}

const statusConfig: Record<
  Status,
  { label: string; className: string; icon: string }
> = {
  active: {
    label: "稼働中",
    className: "bg-emerald-600 text-white",
    icon: "✓",
  },
  approved: {
    label: "承認済み",
    className: "bg-emerald-600 text-white",
    icon: "✓",
  },
  pending: {
    label: "承認待ち",
    className: "bg-amber-600 text-white",
    icon: "⏳",
  },
  suspended: {
    label: "停止中",
    className: "bg-rose-700 text-white",
    icon: "⏸",
  },
  rejected: {
    label: "却下",
    className: "bg-rose-700 text-white",
    icon: "✕",
  },
  reported: {
    label: "報告あり",
    className: "bg-violet-600 text-white",
    icon: "🚨",
  },
  published: {
    label: "公開中",
    className: "bg-emerald-600 text-white",
    icon: "✓",
  },
  flagged: {
    label: "要確認",
    className: "bg-rose-700 text-white",
    icon: "⚠",
  },
  hidden: {
    label: "非公開",
    className: "bg-amber-600 text-white",
    icon: "🔒",
  },
  deleted: {
    label: "削除済み",
    className: "bg-slate-500 text-white",
    icon: "✕",
  },
};

export const StatusBadge = React.memo(function StatusBadge({
  status,
  customLabel,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const label = customLabel || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${config.className}`}
      role="status"
      aria-label={label}
    >
      <span aria-hidden="true">{config.icon}</span>
      {label}
    </span>
  );
});
