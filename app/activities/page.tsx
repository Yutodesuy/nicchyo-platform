import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getActivitiesSortedDesc } from "../data/activities";

export const metadata: Metadata = {
  title: "取り組み | nicchyo",
  description: "nicchyoの活動記録、行政連携、現地調査、受賞、発表の一覧です。",
};

const categoryStyles = {
  行政連携: "bg-amber-100 text-amber-800",
  現地調査: "bg-orange-100 text-orange-800",
  発表: "bg-stone-200 text-stone-700",
  受賞: "bg-yellow-100 text-yellow-800",
} as const;

export default function ActivitiesPage() {
  const activities = getActivitiesSortedDesc();

  return (
    <main className="min-h-screen bg-[#f7f1e8] px-4 py-10 text-stone-900 sm:px-6 md:px-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a5129] transition hover:text-[#6f3a16]"
        >
          <ChevronLeft className="h-4 w-4" />
          トップへ戻る
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">PROJECT ARCHIVE</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-6xl">
            プロジェクトの歩み
          </h1>
          <p className="mt-4 text-lg leading-8 text-stone-700 md:text-xl">
            行政連携、現地調査、発表、受賞など、
            <br />
            nicchyoが積み重ねてきた取り組みをまとめています。
          </p>
        </div>

        <div className="mt-10 space-y-5">
          {activities.map((activity) => (
            <article
              key={`${activity.date}-${activity.title}`}
              className="rounded-[2rem] border border-[#ead8c0] bg-white px-5 py-5 shadow-[0_18px_48px_rgba(102,58,20,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.12em] text-[#9a5a2e]">
                  {activity.date}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyles[activity.category]}`}
                >
                  {activity.category}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-[#4c2810]">
                {activity.title}
              </h2>
              {activity.note ? (
                <p className="mt-2 text-sm font-medium text-stone-500">{activity.note}</p>
              ) : null}
              <p className="mt-3 text-base leading-8 text-stone-700">{activity.summary}</p>
              <Link
                href={`/activities/${activity.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8a5129] transition hover:text-[#6f3a16]"
              >
                詳しく見る
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
