/**
 * 市場での行動統計を localStorage に記録・取得するユーティリティ
 */

const KEYS = {
  bannerOpens: "nicchyo-banner-opens",
  marketTimeMs: "nicchyo-market-time-ms",
  marketEntryTs: "nicchyo-market-entry-ts",
} as const;

// ─── バナー開封 ────────────────────────────────────────────────────────────────

export function incrementBannerOpens(): void {
  if (typeof window === "undefined") return;
  const current = getBannerOpens();
  localStorage.setItem(KEYS.bannerOpens, String(current + 1));
}

export function getBannerOpens(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEYS.bannerOpens) ?? "0", 10) || 0;
}

// ─── 市場滞在時間 ──────────────────────────────────────────────────────────────

export function recordMarketEnter(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.marketEntryTs)) return; // すでに入場中
  localStorage.setItem(KEYS.marketEntryTs, String(Date.now()));
}

export function recordMarketExit(): void {
  if (typeof window === "undefined") return;
  const entryTsStr = localStorage.getItem(KEYS.marketEntryTs);
  if (!entryTsStr) return;
  const entryTs = parseInt(entryTsStr, 10);
  const elapsed = Date.now() - entryTs;
  const accumulated = getAccumulatedMarketTimeMs();
  localStorage.setItem(KEYS.marketTimeMs, String(accumulated + elapsed));
  localStorage.removeItem(KEYS.marketEntryTs);
}

/** 累積滞在時間（ms）。現在入場中の場合は現在のセッション分も加算する */
export function getAccumulatedMarketTimeMs(): number {
  if (typeof window === "undefined") return 0;
  const base = parseInt(localStorage.getItem(KEYS.marketTimeMs) ?? "0", 10) || 0;
  const entryTsStr = localStorage.getItem(KEYS.marketEntryTs);
  if (!entryTsStr) return base;
  const elapsed = Date.now() - parseInt(entryTsStr, 10);
  return base + (elapsed > 0 ? elapsed : 0);
}
