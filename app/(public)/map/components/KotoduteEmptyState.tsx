"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

type KotoduteEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  className?: string; // for color variations (bg, border, text color)
};

/**
 * ことづて（ショップステータス共有）用の汎用エンプティステートコンポーネント
 * アイコン、タイトル、説明、アクションボタンを表示して投稿を促します。
 */
export default function KotoduteEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  href,
  className = "bg-slate-50 border-slate-200 text-slate-600",
}: KotoduteEmptyStateProps) {
  return (
    <div className={`mt-6 rounded-xl border-2 border-dashed px-6 py-8 text-center ${className}`}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-current/10">
        <Icon size={24} className="opacity-80" />
      </div>
      <h3 className="mb-2 text-lg font-bold opacity-90">{title}</h3>
      <p className="mx-auto mb-6 max-w-xs text-sm opacity-80 leading-relaxed">
        {description}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold shadow-sm ring-1 ring-inset ring-current/20 transition hover:bg-white/80 active:scale-95 text-current"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
