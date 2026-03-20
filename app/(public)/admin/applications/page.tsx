"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { AdminLayout, AdminPageHeader, EmptyState } from "@/components/admin";
import { showToast } from "@/lib/admin/toast";
import { Loader2, Search, Check, X, Clock } from "lucide-react";

type AppStatus = "pending" | "approved" | "rejected";

type Application = {
  id: string;
  shop_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  category_id: string | null;
  main_products: string[];
  message: string | null;
  status: AppStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  categories: { name: string } | null;
};

type DbRow = Application & { categories: { name: string } | null };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

const STATUS_CONFIG: Record<AppStatus, { label: string; bg: string }> = {
  pending:  { label: "審査待ち", bg: "bg-orange-600 text-white" },
  approved: { label: "承認済み", bg: "bg-green-700 text-white" },
  rejected: { label: "却下",     bg: "bg-red-600 text-white" },
};

export default function ApplicationsPage() {
  const { permissions, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [apps, setApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AppStatus>("all");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!permissions.isSuperAdmin) router.push("/");
  }, [authLoading, permissions.isSuperAdmin, router]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vendor_applications")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      showToast.error("データの取得に失敗しました");
      setIsLoading(false);
      return;
    }
    setApps((data as unknown as DbRow[]) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && permissions.isSuperAdmin) load();
  }, [authLoading, permissions.isSuperAdmin, load]);

  const handleReview = useCallback(async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_note: reviewNote[id] ?? null }),
      });
      if (!res.ok) throw new Error();
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status, review_note: reviewNote[id] ?? null } : a));
      showToast.success(status === "approved" ? "申請を承認しました" : "申請を却下しました");
      setExpandedId(null);
    } catch {
      showToast.error("操作に失敗しました");
    } finally {
      setProcessingId(null);
    }
  }, [reviewNote]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.shop_name.toLowerCase().includes(q) ||
          a.owner_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apps, filter, search]);

  const stats = useMemo(() => ({
    total: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  }), [apps]);

  if (authLoading || !permissions.isSuperAdmin) return null;

  return (
    <AdminLayout>
      <AdminPageHeader eyebrow="Applications" title="出店申請管理" />

      <div className="mx-auto max-w-7xl px-4 py-8 pb-20">

        {/* 統計カード */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">総申請数</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">審査待ち</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">承認済み</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">却下</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* フィルター */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => {
              const labels = {
                all: `すべて (${stats.total})`,
                pending: `審査待ち (${stats.pending})`,
                approved: `承認済み (${stats.approved})`,
                rejected: `却下 (${stats.rejected})`,
              };
              const activeColors = { all: "bg-slate-700", pending: "bg-orange-600", approved: "bg-green-700", rejected: "bg-red-600" };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    filter === f ? `${activeColors[f]} text-white` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="店舗名・代表者・メールで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* リスト */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title="申請が見つかりません" description="条件に一致する申請はありません。" />
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* ヘッダー行 */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">{app.shop_name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONFIG[app.status].bg}`}>
                        {STATUS_CONFIG[app.status].label}
                      </span>
                      {app.categories?.name && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {app.categories.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{app.owner_name}</span>
                      <span>{app.email}</span>
                      {app.phone && <span>{app.phone}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} />{formatDate(app.created_at)}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs">{expandedId === app.id ? "▲" : "▼"}</span>
                </button>

                {/* 展開詳細 */}
                {expandedId === app.id && (
                  <div className="border-t border-slate-100 px-5 pb-5">
                    {/* 販売品目 */}
                    {app.main_products.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">販売品目</p>
                        <div className="flex flex-wrap gap-2">
                          {app.main_products.map((p) => (
                            <span key={p} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 申請メッセージ */}
                    {app.message && (
                      <div className="mt-4">
                        <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">申請理由・意気込み</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.message}</p>
                      </div>
                    )}

                    {/* 既存のレビューコメント */}
                    {app.review_note && (
                      <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">審査コメント</p>
                        <p className="mt-1 text-sm text-slate-700">{app.review_note}</p>
                      </div>
                    )}

                    {/* 審査アクション（pending のみ） */}
                    {app.status === "pending" && (
                      <div className="mt-5 space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            コメント（任意）
                          </label>
                          <textarea
                            value={reviewNote[app.id] ?? ""}
                            onChange={(e) => setReviewNote((prev) => ({ ...prev, [app.id]: e.target.value }))}
                            rows={2}
                            placeholder="承認・却下の理由など"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReview(app.id, "approved")}
                            disabled={processingId === app.id}
                            className="flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                          >
                            {processingId === app.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            承認
                          </button>
                          <button
                            onClick={() => handleReview(app.id, "rejected")}
                            disabled={processingId === app.id}
                            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {processingId === app.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                            却下
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
