"use client";

import type { RefObject } from "react";
import type { BannerTheme, ActivePostItem } from "./ShopBannerHero";

export function PostCarousel({
  activePosts,
  theme,
  currentPostIndex,
  isActivePostCentered,
  activePostRef,
  activePostCarouselRef,
}: {
  activePosts: ActivePostItem[];
  theme: BannerTheme;
  currentPostIndex: number;
  isActivePostCentered: boolean;
  activePostRef: RefObject<HTMLDivElement>;
  activePostCarouselRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={activePostRef}
      className={`overflow-hidden rounded-2xl border shadow-sm ${isActivePostCentered ? "center-bounce-in" : ""}`}
      style={{ borderColor: theme.border }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: theme.light }}>
        <span className="text-base">📢</span>
        <span className="text-sm font-bold" style={{ color: theme.text }}>今日のお知らせ</span>
        {activePosts.length > 1 && (
          <div className="ml-auto flex gap-1">
            {activePosts.map((_, i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{ backgroundColor: i === currentPostIndex ? theme.accent : theme.border }}
              />
            ))}
          </div>
        )}
      </div>

      <div ref={activePostCarouselRef} className="flex snap-x snap-mandatory overflow-x-hidden scroll-smooth">
        {activePosts.map((post, index) => (
          <article key={index} className="w-full shrink-0 snap-center">
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageUrl} alt="お知らせ画像" className="h-48 w-full object-cover" />
            )}
            <div className="px-4 py-3">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">{post.text}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {(() => {
                    const diff = new Date(post.expiresAt).getTime() - Date.now();
                    if (diff <= 0) return "期限切れ";
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    return h > 0 ? `あと${h}時間` : `あと${m}分`;
                  })()}
                </span>
                {post.createdAt && (
                  <span>
                    {new Intl.DateTimeFormat("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(post.createdAt))}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
