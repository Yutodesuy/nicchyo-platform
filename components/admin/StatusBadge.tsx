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
    className: "bg-green-100 text-green-800",
    icon: "✓",
  },
  approved: {
    label: "承認済み",
    className: "bg-green-100 text-green-800",
    icon: "✓",
  },
  pending: {
    label: "承認待ち",
    className: "bg-orange-100 text-orange-800",
    icon: "⏳",
  },
  suspended: {
    label: "停止中",
    className: "bg-red-100 text-red-800",
    icon: "⏸",
  },
  rejected: {
    label: "却下",
    className: "bg-red-100 text-red-800",
    icon: "✕",
  },
  reported: {
    label: "報告あり",
    className: "bg-purple-100 text-purple-800",
    icon: "🚨",
  },
  published: {
    label: "公開中",
    className: "bg-blue-100 text-blue-800",
    icon: "✓",
  },
  flagged: {
    label: "要確認",
    className: "bg-red-100 text-red-800",
    icon: "⚠️",
  },
  hidden: {
    label: "非公開",
    className: "bg-orange-100 text-orange-800",
    icon: "🔒",
  },
  deleted: {
    label: "削除済み",
    className: "bg-gray-100 text-gray-800",
    icon: "🗑️",
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
