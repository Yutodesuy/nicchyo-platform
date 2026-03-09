"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import NavigationBar from "@/app/components/NavigationBar";
import { MOCK_POSTS, MOCK_STATS, MOCK_STORE } from "../_mock/data";
import {
  PlusCircle,
  Clock,
  Store,
  Megaphone,
  Eye,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function timeUntil(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return "期限切れ";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `あと${h}時間${m > 0 ? `${m}分` : ""}`;
  return `あと${m}分`;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const QUICK_ACTIONS = [
  {
    label: "投稿する",
    desc: "最新情報を発信",
    href: "/vendor/post/new",
    icon: PlusCircle,
    color: "bg-amber-500 hover:bg-amber-400",
    textColor: "text-white",
  },
  {
    label: "投稿履歴",
    desc: "過去の投稿を再利用",
    href: "/vendor/posts",
    icon: FileText,
    color: "bg-white hover:bg-slate-50 border border-slate-200",
    textColor: "text-slate-800",
  },
  {
    label: "店舗情報",
    desc: "基本情報を更新",
    href: "/vendor/store",
    icon: Store,
    color: "bg-white hover:bg-slate-50 border border-slate-200",
    textColor: "text-slate-800",
  },
];

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const activePosts = MOCK_POSTS.filter((p) => p.status === "active");

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      {/* ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-5 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-600">
            Vendor Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {MOCK_STORE.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {user?.name ?? "出店者"} さん、こんにちは
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-5">

        {/* 統計カード */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-amber-100 bg-white p-4 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-amber-600">
              <Megaphone size={16} />
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{MOCK_STATS.activePosts}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">投稿中</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-white p-4 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-sky-500">
              <Eye size={16} />
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{MOCK_STATS.todayViews}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">本日の閲覧</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-emerald-600">
              <FileText size={16} />
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{MOCK_STATS.totalPosts}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">総投稿数</p>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="space-y-2.5">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center justify-between rounded-2xl px-5 py-4 shadow-sm transition ${action.color} ${action.textColor}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <div>
                    <p className="font-semibold">{action.label}</p>
                    <p className={`text-xs ${action.textColor === "text-white" ? "text-amber-100" : "text-slate-500"}`}>
                      {action.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="opacity-60" />
              </Link>
            );
          })}
        </div>

        {/* アクティブな投稿 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              現在の投稿
            </h2>
            <Link
              href="/vendor/posts"
              className="text-xs font-medium text-amber-600 hover:underline"
            >
              すべて見る
            </Link>
          </div>

          {activePosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
              <AlertCircle size={28} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">現在アクティブな投稿はありません</p>
              <Link
                href="/vendor/post/new"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-400"
              >
                <PlusCircle size={15} />
                投稿を作成する
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activePosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {post.image_url && (
                      <div
                        className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100"
                        style={{
                          backgroundImage: `url(${post.image_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-slate-800">{post.text}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <CheckCircle2 size={10} />
                          公開中
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={10} />
                          {timeUntil(post.expiration_time)}（{formatTime(post.expiration_time)}まで）
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 店舗情報サマリー */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">店舗情報</h2>
            <Link
              href="/vendor/store"
              className="text-xs font-medium text-amber-600 hover:underline"
            >
              編集する
            </Link>
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 flex-shrink-0 text-slate-400">主な商品</dt>
              <dd className="text-slate-700">{MOCK_STORE.main_products.join("・")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 flex-shrink-0 text-slate-400">出店日</dt>
              <dd className="text-slate-700">{MOCK_STORE.schedule.join("、")}</dd>
            </div>
          </dl>
        </div>

      </div>

      <NavigationBar />
    </div>
  );
}
