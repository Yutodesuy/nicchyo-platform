// app/(public)/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  MapPin,
  ShoppingBag,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Globe,
  X as XIcon,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
} from "lucide-react";
import { Shop } from "../data/shops";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "../../../../lib/auth/AuthContext";
import { getShopBannerImage } from "../../../../lib/shopImages";
import { useBag } from "../../../../lib/storage/BagContext";
import { incrementBannerOpens } from "../../../../lib/storage/marketStats";
import { ingredientCatalog, recipes } from "../../../../lib/recipes";
import {
  KOTODUTE_UPDATED_EVENT,
  loadKotodute,
  saveKotodute,
  type KotoduteNote,
} from "../../../../lib/kotoduteStorage";

// ─── Theme presets ────────────────────────────────────────────────────────────
const THEME_PRESETS = {
  amber:  { bg: "#FFFBEB", accent: "#F59E0B", text: "#92400E", border: "#FDE68A", light: "#FEF3C7" },
  green:  { bg: "#F0FDF4", accent: "#7ED957", text: "#166534", border: "#BBF7D0", light: "#DCFCE7" },
  orange: { bg: "#FFF7ED", accent: "#F97316", text: "#9A3412", border: "#FED7AA", light: "#FFEDD5" },
  earth:  { bg: "#FDF6EE", accent: "#B45309", text: "#7C2D12", border: "#DDB898", light: "#FEF3E2" },
  navy:   { bg: "#EFF6FF", accent: "#3B82F6", text: "#1E40AF", border: "#BFDBFE", light: "#DBEAFE" },
  rose:   { bg: "#FFF1F2", accent: "#F43F5E", text: "#9F1239", border: "#FECDD3", light: "#FFE4E6" },
} as const;

type ThemeKey = keyof typeof THEME_PRESETS;
type BannerTheme = { bg: string; accent: string; text: string; border: string; light: string };
type MainSurface = "summary" | "detail";
type BannerSurface = MainSurface | "kotodute" | "ai";

function isMainSurface(surface: BannerSurface): surface is MainSurface {
  return surface === "summary" || surface === "detail";
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ShopDetailBannerProps = {
  shop: Shop;
  bagCount?: number;
  onClose?: () => void;
  onAddToBag?: (name: string, fromShopId?: number) => void;
  variant?: "default" | "kotodute";
  originRect?: { x: number; y: number; width: number; height: number };
  layout?: "overlay" | "inline";
  openNonce?: number;
  initialMobileSurface?: MainSurface;
  onMobileMainSurfaceChange?: (surface: MainSurface) => void;
  canNavigateBetweenShops?: boolean;
  selectedShopPosition?: number;
  totalShopCount?: number;
  onSelectPreviousShop?: () => void;
  onSelectNextShop?: () => void;
  activeCouponTypeId?: string;
  stampedVendorIds?: string[];
  reserveBottomNavSpace?: boolean;
};

type BagItem = {
  name: string;
  fromShopId?: number;
};

type ActivePostItem = {
  text: string;
  imageUrl?: string;
  expiresAt: string;
  createdAt?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "nicchyo-fridge-items";
const KOTODUTE_PREVIEW_LIMIT = 3;
const KOTODUTE_TAG_REGEX = /\s*#\d+|\s*#all/gi;
const OSEKKAI_FALLBACK =
  "あら、ここのお店、最近行ってないねぇ。今日は何が出ちゅうか、ちょっと見てきてくれん？";
const BOTTOM_NAV_HEIGHT = 56;
const DRAWER_PEEK_HEIGHT = 150;
const DRAWER_FULL_RATIO = 0.9;
const COLLAPSED_SUMMARY_OFFSET_PX = 10;

const buildBagKey = (name: string, shopId?: number) =>
  `${name.trim().toLowerCase()}-${shopId ?? "any"}`;

function formatBusinessHours(start?: string, end?: string) {
  const trimmedStart = start?.trim();
  const trimmedEnd = end?.trim();
  if (trimmedStart && trimmedEnd) return `${trimmedStart} 〜 ${trimmedEnd}`;
  if (trimmedStart) return `${trimmedStart}から`;
  if (trimmedEnd) return `${trimmedEnd}まで`;
  return null;
}

function ShopBusinessInfoCard({ shop, theme }: { shop: Shop; theme: BannerTheme }) {
  const businessHours = formatBusinessHours(shop.businessHoursStart, shop.businessHoursEnd);
  const scheduleText = shop.schedule?.trim() || "出店予定は未設定です";
  const rainPolicyLabel =
    shop.rainPolicy && shop.rainPolicy !== "undecided"
      ? shop.rainPolicy === "outdoor"
        ? "雨でも出店"
        : shop.rainPolicy === "tent"
          ? "雨でも出店（テント）"
          : "雨天中止"
      : null;

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{ borderColor: theme.border, backgroundColor: theme.bg }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
          aria-hidden
        >
          <Clock className="h-4 w-4" style={{ color: theme.text }} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.text }}>
            営業情報
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-700">
            今日行く前に、ここだけ確認できます
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/80 bg-white px-3 py-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            出店予定
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-800">
            {scheduleText}
          </p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white px-3 py-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            営業時間
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {businessHours || "営業時間は未設定です"}
          </p>
          {rainPolicyLabel && (
            <p className="mt-1 text-xs font-medium text-slate-500">{rainPolicyLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function findIngredientMatch(name: string) {
  const lower = name.trim().toLowerCase();
  return ingredientCatalog.find(
    (ing) =>
      ing.name.toLowerCase().includes(lower) ||
      lower.includes(ing.name.toLowerCase()) ||
      ing.id.toLowerCase() === lower ||
      ing.id.toLowerCase().includes(lower) ||
      ing.aliases?.some(
        (alias) =>
          alias.toLowerCase().includes(lower) ||
          lower.includes(alias.toLowerCase())
      )
  );
}

function loadBagItems(): BagItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BagItem[];
  } catch {
    return [];
  }
}

function useCenterBounceTrigger(
  rootRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>
) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const target = targetRef.current;
    if (!root || !target || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { setIsActive(entry.isIntersecting); },
      { root, threshold: 0.55, rootMargin: "-28% 0px -28% 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [rootRef, targetRef]);

  return isActive;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

// ─── Category fallback ────────────────────────────────────────────────────────
const CATEGORY_FALLBACK: Record<string, { emoji: string; gradient: string }> = {
  "食材":     { emoji: "🥦", gradient: "bg-gradient-to-br from-emerald-100 to-green-200" },
  "加工食品": { emoji: "🍱", gradient: "bg-gradient-to-br from-amber-100 to-orange-200" },
  "工芸品":   { emoji: "🎨", gradient: "bg-gradient-to-br from-purple-100 to-indigo-200" },
  "植物":     { emoji: "🌿", gradient: "bg-gradient-to-br from-green-100 to-emerald-200" },
  "飲食":     { emoji: "🍜", gradient: "bg-gradient-to-br from-orange-100 to-red-200" },
};

function ShopBannerHero({
  shop,
  bannerImage,
  theme,
  heroImageError,
  onImageError,
  mode,
  isKotodute,
  showProductPreview = false,
  onEdit,
  couponBadge,
  couponStatus,
  primaryCouponSetting,
}: {
  shop: Shop;
  bannerImage: string;
  theme: BannerTheme;
  heroImageError: boolean;
  onImageError: () => void;
  mode: "compact" | "expanded";
  isKotodute: boolean;
  showProductPreview?: boolean;
  onEdit?: () => void;
  couponBadge?: React.ReactNode;
  couponStatus?: "active" | "stamped" | "participating" | null;
  primaryCouponSetting?: {
    coupon_type_id: string;
    coupon_type_name: string;
    coupon_type_emoji: string;
    coupon_type_amount: number;
    min_purchase_amount: number;
  } | null;
}) {
  if (mode === "compact") {
    // クーポン状態に応じた右側カード
    const couponCard =
      couponStatus === "active" && primaryCouponSetting ? (
        <div className="mr-10 flex h-[86px] w-[84px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-green-500 text-white shadow-md">
          <span className="text-[15px] leading-none">{primaryCouponSetting.coupon_type_emoji}</span>
          <span className="mt-1 text-[22px] font-extrabold leading-none">
            ¥{primaryCouponSetting.coupon_type_amount.toLocaleString()}
          </span>
          <span className="mt-0.5 text-[10px] font-bold opacity-90">引き</span>
          <span className="mt-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">
            今すぐ使える
          </span>
        </div>
      ) : couponStatus === "stamped" ? (
        <div className="mr-10 flex h-[86px] w-[84px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[18px] border border-emerald-200 bg-emerald-50">
          <span className="text-[22px]">✅</span>
          <span className="text-center text-[10px] font-bold leading-tight text-emerald-700">
            スタンプ
            <br />
            済み
          </span>
        </div>
      ) : couponStatus === "participating" && primaryCouponSetting ? (
        <div className="mr-10 flex h-[86px] w-[84px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[18px] border-[1.5px] border-dashed border-green-200 bg-green-50">
          <span className="text-[18px]">🎟️</span>
          <span className="text-center text-[10px] font-bold leading-tight text-green-700">
            クーポン
            <br />
            使えます
          </span>
          <span className="mt-0.5 text-[9px] font-semibold text-green-500">
            ¥{primaryCouponSetting.coupon_type_amount.toLocaleString()}引き
          </span>
        </div>
      ) : null;

    return (
      <div className="flex items-center gap-3">
        {/* サムネイル */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {heroImageError ? (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xl">
              {CATEGORY_FALLBACK[shop.category ?? ""]?.emoji ?? "🏪"}
            </div>
          ) : (
            <Image
              src={bannerImage}
              alt={`${shop.name}の写真`}
              fill
              className="object-cover object-center"
              onError={onImageError}
            />
          )}
        </div>

        {/* 店舗情報 */}
        <div className={`min-w-0 flex-1 ${!couponCard ? "pr-12" : ""}`}>
          <div className="flex flex-wrap items-center gap-1">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ backgroundColor: theme.light, color: theme.text }}
            >
              {shop.category || "ショップ"}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              今日出店中
            </span>
            {!couponCard && couponBadge}
          </div>
          <h2 className="mt-1 line-clamp-2 text-[17px] font-extrabold leading-tight text-slate-900">
            {shop.name}
          </h2>
          {!isKotodute && shop.catchphrase && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{shop.catchphrase}</p>
          )}
          {/* クーポンがない場合のみ商品プレビュー */}
          {!couponCard && showProductPreview && !isKotodute && shop.products.length > 0 && (
            <div className="mt-1.5 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {shop.products.slice(0, 4).map((product) => (
                <span
                  key={product}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-600"
                >
                  {product}
                </span>
              ))}
              {shop.products.length > 4 && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                  +{shop.products.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* クーポンカード（右側） */}
        {couponCard}
      </div>
    );
  }

  return (
    <div className="relative h-56 overflow-hidden rounded-[28px] border border-slate-100 bg-slate-100 shadow-sm md:h-64 md:rounded-none md:border-0 md:shadow-none">
      {heroImageError ? (
        <div
          className={`flex h-full w-full items-center justify-center ${
            CATEGORY_FALLBACK[shop.category ?? ""]?.gradient ?? "bg-gradient-to-br from-slate-100 to-slate-200"
          }`}
        >
          <span className="text-7xl">{CATEGORY_FALLBACK[shop.category ?? ""]?.emoji ?? "🏪"}</span>
        </div>
      ) : (
        <Image
          src={bannerImage}
          alt={`${shop.name}の写真`}
          fill
          className="object-cover object-center"
          priority
          onError={onImageError}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm"
              >
                {shop.category || "ショップ"}
              </span>
              <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                今日出店中
              </span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight text-white drop-shadow-md md:text-4xl">
              {shop.name}
            </h2>
            {!isKotodute && shop.catchphrase && (
              <p className="mt-1 text-sm font-medium text-white/80 drop-shadow">
                {shop.catchphrase}
              </p>
            )}
          </div>
          {onEdit && !isKotodute && (
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <Pencil className="h-3 w-3" />
              編集
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopSubviewHeader({
  shop,
  bannerImage,
  theme,
  heroImageError,
  onImageError,
  title,
  titleIcon,
  onBack,
  onClose,
  rightSlot,
}: {
  shop: Shop;
  bannerImage: string;
  theme: BannerTheme;
  heroImageError: boolean;
  onImageError: () => void;
  title: string;
  titleIcon?: ReactNode;
  onBack: () => void;
  onClose?: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <div
      className="sticky top-0 z-10 shrink-0 border-b bg-white/95 px-3 py-3 backdrop-blur-sm"
      style={{ borderColor: theme.border }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          戻る
        </button>

        <div className="flex flex-1 items-center justify-center gap-1.5 text-sm font-bold text-slate-900">
          {titleIcon}
          <span>{title}</span>
        </div>

        {rightSlot || onClose ? (
          <div className="flex min-w-[3.5rem] items-center justify-end gap-1.5">
            {rightSlot}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200"
                aria-label="閉じる"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-14" />
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {heroImageError ? (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-base">
                {CATEGORY_FALLBACK[shop.category ?? ""]?.emoji ?? "🏪"}
              </div>
            ) : (
              <Image
                src={bannerImage}
                alt={`${shop.name}の写真`}
                fill
                className="object-cover object-center"
                onError={onImageError}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ backgroundColor: theme.light, color: theme.text }}
              >
                {shop.category || "ショップ"}
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                今日出店中
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-bold text-slate-900">{shop.name}</p>
            {shop.catchphrase && (
              <p className="line-clamp-1 text-xs text-slate-500">{shop.catchphrase}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerActivePostsCard({
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
  activePostRef: RefObject<HTMLDivElement | null>;
  activePostCarouselRef: RefObject<HTMLDivElement | null>;
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShopDetailBanner({
  shop,
  bagCount,
  onClose,
  onAddToBag,
  variant = "default",
  originRect,
  layout = "overlay",
  openNonce = 0,
  initialMobileSurface = "detail",
  onMobileMainSurfaceChange,
  canNavigateBetweenShops = false,
  selectedShopPosition = 0,
  totalShopCount = 0,
  onSelectPreviousShop,
  onSelectNextShop,
  activeCouponTypeId,
  stampedVendorIds,
  reserveBottomNavSpace = true,
}: ShopDetailBannerProps) {
  const router = useRouter();
  const { permissions } = useAuth();
  const { addItem, removeItem, items: bagContextItems } = useBag();
  const [bagProductKeys, setBagProductKeys] = useState<Set<string>>(new Set());
  const [kotoduteNotes, setKotoduteNotes] = useState<KotoduteNote[]>([]);
  const [couponInfo, setCouponInfo] = useState<{
    is_participating: boolean;
    settings: Array<{
      coupon_type_id: string;
      coupon_type_name: string;
      coupon_type_emoji: string;
      coupon_type_amount: number;
      min_purchase_amount: number;
    }>;
  } | null>(null);
  // セッション中のクーポン情報キャッシュ（vendorId → データ）
  const couponInfoCacheRef = useRef<Map<string, typeof couponInfo>>(new Map());
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [heroImageError, setHeroImageError] = useState(false);

  // ─── クーポン派生状態 ─────────────────────────────────────────────────────────
  const isStamped = !!shop.vendorId && (stampedVendorIds ?? []).includes(shop.vendorId);
  const primaryCouponSetting = couponInfo?.settings?.find(
    (s) => s.coupon_type_id === activeCouponTypeId
  ) ?? couponInfo?.settings?.[0] ?? null;
  const couponStatus: "active" | "stamped" | "participating" | null = (() => {
    if (!couponInfo?.is_participating || !couponInfo.settings.length) return null;
    if (isStamped) return "stamped";
    if (activeCouponTypeId && couponInfo.settings.some((s) => s.coupon_type_id === activeCouponTypeId)) return "active";
    return "participating";
  })();
  const [toast, setToast] = useState<{ product: string } | null>(null);
  const [surface, setSurface] = useState<BannerSurface>(initialMobileSurface);
  const [contentInteractive, setContentInteractive] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activePostRef = useRef<HTMLDivElement | null>(null);
  const activePostCarouselRef = useRef<HTMLDivElement | null>(null);
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);
  const mainScrollTopRef = useRef(0);
  const lastMainSurfaceRef = useRef<MainSurface>(initialMobileSurface);
  const drawerRafRef = useRef<number | null>(null);
  const drawerTranslateRef = useRef(0);
  const drawerDragRef = useRef({
    active: false,
    startY: 0,
    startTranslate: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
  });
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  const [drawerSurface, setDrawerSurface] = useState<MainSurface>(initialMobileSurface);
  const drawerSurfaceRef = useRef<MainSurface>(initialMobileSurface);
  drawerSurfaceRef.current = drawerSurface;
  const [drawerHeights, setDrawerHeights] = useState({
    peek: DRAWER_PEEK_HEIGHT,
    full: 620,
  });

  // body scroll lock
  useEffect(() => {
    if (layout !== "overlay" || typeof document === "undefined") return;
    document.body.classList.add("shop-banner-open");
    return () => { document.body.classList.remove("shop-banner-open"); };
  }, [layout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsDesktopViewport(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // bag sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateBag = () => {
      const items = loadBagItems();
      const keys = new Set<string>();
      items.forEach((item) => {
        const key = buildBagKey(item.name, item.fromShopId);
        keys.add(key);
        if (item.fromShopId === undefined) {
          keys.add(buildBagKey(item.name, undefined));
        }
      });
      setBagProductKeys(keys);
    };
    updateBag();
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) updateBag();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // バナー開封カウント
  useEffect(() => {
    incrementBannerOpens();
  }, [shop.id, openNonce]);

  // クーポン参加情報を取得（vendorIdがある出店者のみ、セッション中キャッシュ付き）
  useEffect(() => {
    const vendorId = shop.vendorId;
    if (!vendorId) {
      setCouponInfo(null);
      return;
    }
    const cached = couponInfoCacheRef.current.get(vendorId);
    if (cached !== undefined) {
      setCouponInfo(cached);
      return;
    }
    fetch(`/api/coupons/shop-info?vendor_id=${encodeURIComponent(vendorId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const value = data ?? null;
        couponInfoCacheRef.current.set(vendorId, value);
        setCouponInfo(value);
      })
      .catch(() => {
        // クーポン情報取得失敗は無視
      });
  }, [shop.vendorId]);

  // kotodute sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateKotodute = () => {
      const notes = loadKotodute().filter(
        (note) => typeof note.shopId === "number" && note.shopId === shop.id
      );
      setKotoduteNotes(notes.slice().sort((a, b) => b.createdAt - a.createdAt));
    };
    updateKotodute();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "nicchyo-kotodute-notes") updateKotodute();
    };
    const handleUpdate = () => updateKotodute();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(KOTODUTE_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(KOTODUTE_UPDATED_EVENT, handleUpdate);
    };
  }, [shop.id, openNonce]);

  const handleProductTap = useCallback((product: string) => {
    // 即追加 (Undo パターン)
    if (onAddToBag) {
      onAddToBag(product, shop.id);
    } else {
      addItem({ name: product, fromShopId: shop.id });
    }
    setBagProductKeys((prev) => {
      const next = new Set(prev);
      next.add(buildBagKey(product, shop.id));
      return next;
    });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ product });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, [addItem, onAddToBag, shop.id]);

  const handleUndoAdd = useCallback((product: string) => {
    const item = bagContextItems.slice().reverse().find(
      (i) => i.name === product && i.fromShopId === shop.id
    );
    if (item) removeItem(item.id);
    setBagProductKeys((prev) => {
      const next = new Set(prev);
      next.delete(buildBagKey(product, shop.id));
      return next;
    });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, [bagContextItems, removeItem, shop.id]);

  const handleBagClick = useCallback(() => { router.push("/bag"); }, [router]);

  const isKotodute = variant === "kotodute";
  const today = new Date();

  const matchedIngredientIds = useMemo(() => {
    if (shop.category !== "食材") return [];
    return shop.products.map((p) => findIngredientMatch(p)?.id).filter(Boolean) as string[];
  }, [shop.category, shop.products]);

  const suggestedRecipes = useMemo(() => {
    if (matchedIngredientIds.length === 0) return [];
    const ids = new Set(matchedIngredientIds);
    return recipes.filter((r) => r.ingredientIds.some((id) => ids.has(id))).slice(0, 2);
  }, [matchedIngredientIds]);

  const canEditShop = permissions.canEditShop(shop.id);
  const bannerSeed = shop.position ?? shop.id;
  const bannerImage = shop.images?.main ?? getShopBannerImage(shop.category, bannerSeed);

  const handleEditShop = useCallback(() => { router.push("/my-shop"); }, [router]);

  const bannerStyle = useMemo(() => {
    if (!originRect || typeof window === "undefined") return undefined;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const originCenterX = originRect.x + originRect.width / 2;
    const originCenterY = originRect.y + originRect.height / 2;
    const translateX = originCenterX - vw / 2;
    const translateY = originCenterY - vh / 2;
    const scaleX = Math.max(0.08, originRect.width / vw);
    const scaleY = Math.max(0.08, originRect.height / vh);
    return {
      ["--banner-translate-x" as any]: `${translateX}px`,
      ["--banner-translate-y" as any]: `${translateY}px`,
      ["--banner-scale-x" as any]: scaleX,
      ["--banner-scale-y" as any]: scaleY,
    } as CSSProperties;
  }, [originRect]);

  const activePosts = useMemo(() => {
    if (shop.activePosts && shop.activePosts.length > 0) return shop.activePosts;
    if (shop.activePost) {
      return [{ text: shop.activePost.text, imageUrl: shop.activePost.imageUrl, expiresAt: shop.activePost.expiresAt, createdAt: shop.activePost.createdAt ?? "" }];
    }
    return [] as ActivePostItem[];
  }, [shop.activePost, shop.activePosts]);

  const productDetailsByName = useMemo(() => {
    const entries = (shop.productDetails ?? []).map((detail) => [
      detail.name.trim().toLowerCase(),
      detail,
    ] as const);
    return new Map(entries);
  }, [shop.productDetails]);

  const armInteractionLock = useCallback((delayMs: number = 650) => {
    if (interactionLockTimerRef.current) clearTimeout(interactionLockTimerRef.current);
    setContentInteractive(false);
    interactionLockTimerRef.current = setTimeout(() => {
      setContentInteractive(true);
    }, delayMs);
  }, []);

  useEffect(() => {
    setCurrentPostIndex(0);
    setHeroImageError(false);
    setToast(null);
    setSurface(initialMobileSurface);
    lastMainSurfaceRef.current = initialMobileSurface;
    setDrawerSurface(initialMobileSurface);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    armInteractionLock();
    return () => {
      if (interactionLockTimerRef.current) clearTimeout(interactionLockTimerRef.current);
    };
  }, [armInteractionLock, initialMobileSurface, shop.id, openNonce]);

  useEffect(() => {
    if (activePosts.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentPostIndex((prev) => (prev + 1) % activePosts.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [activePosts.length]);

  useEffect(() => {
    const container = activePostCarouselRef.current;
    if (!container) return;
    const target = container.children[currentPostIndex] as HTMLElement | undefined;
    if (!target) return;
    container.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  }, [currentPostIndex]);

  const isActivePostCentered = useCenterBounceTrigger(scrollContainerRef, activePostRef);
  const isInline = layout === "inline";
  const isMobileOverlay = layout === "overlay" && !isDesktopViewport;
  const isExpandedMobileMain = isMobileOverlay && surface === "detail";
  const showMobileSummaryHeader = isMobileOverlay && surface === "summary";
  const showMobileDetailControls = isMobileOverlay && surface === "detail";
  const bottomNavOffsetPx = reserveBottomNavSpace ? BOTTOM_NAV_HEIGHT : 0;

  const getDrawerHeights = useCallback(() => {
    if (typeof window === "undefined") {
      return { peek: DRAWER_PEEK_HEIGHT, full: 620 };
    }
    const rootStyle = getComputedStyle(document.documentElement);
    const safeBottom = Number.parseFloat(rootStyle.getPropertyValue("--safe-bottom")) || 0;
    const full = Math.max(
      DRAWER_PEEK_HEIGHT + 220,
      Math.min(
        window.innerHeight - bottomNavOffsetPx - safeBottom,
        Math.round(window.innerHeight * DRAWER_FULL_RATIO - bottomNavOffsetPx)
      )
    );
    return {
      peek: Math.min(DRAWER_PEEK_HEIGHT, full),
      full,
    };
  }, [bottomNavOffsetPx]);

  const getDrawerTranslateForSurface = useCallback((
    nextSurface: MainSurface | BannerSurface,
    heights: { peek: number; full: number }
  ) => {
    const visibleHeight = nextSurface === "summary" ? heights.peek : heights.full;
    const baseTranslate = Math.max(0, heights.full - visibleHeight);
    return nextSurface === "summary"
      ? baseTranslate + COLLAPSED_SUMMARY_OFFSET_PX
      : baseTranslate;
  }, []);

  const applyDrawerTranslate = useCallback((
    nextTranslate: number,
    options?: { immediate?: boolean }
  ) => {
    if (!isMobileOverlay) return;
    const body = sheetBodyRef.current;
    if (!body) return;
    const maxTranslate = Math.max(
      0,
      drawerHeights.full - drawerHeights.peek + COLLAPSED_SUMMARY_OFFSET_PX
    );
    const clamped = Math.max(0, Math.min(maxTranslate, nextTranslate));
    drawerTranslateRef.current = clamped;
    if (options?.immediate) {
      // 同期的にDOMを更新 → ブラウザの初回ペイント前に確実に反映
      if (drawerRafRef.current !== null) {
        cancelAnimationFrame(drawerRafRef.current);
        drawerRafRef.current = null;
      }
      body.style.transition = "none";
      body.style.transform = `translate3d(0, ${clamped}px, 0)`;
    } else {
      if (drawerRafRef.current !== null) {
        cancelAnimationFrame(drawerRafRef.current);
      }
      drawerRafRef.current = requestAnimationFrame(() => {
        const target = sheetBodyRef.current;
        if (!target) return;
        target.style.transition = "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        target.style.transform = `translate3d(0, ${clamped}px, 0)`;
      });
    }
  }, [drawerHeights.full, drawerHeights.peek, isMobileOverlay]);

  const syncDrawerSurface = useCallback((
    nextSurface: MainSurface,
    options?: { immediate?: boolean }
  ) => {
    if (!isMobileOverlay) return;
    lastMainSurfaceRef.current = nextSurface;
    setDrawerSurface(nextSurface);
    applyDrawerTranslate(getDrawerTranslateForSurface(nextSurface, drawerHeights), options);
  }, [applyDrawerTranslate, drawerHeights, getDrawerTranslateForSurface, isMobileOverlay]);

  const handleDrawerTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobileOverlay || !isMainSurface(surface)) return;
    const touch = e.touches[0];
    drawerDragRef.current = {
      active: true,
      startY: touch.clientY,
      startTranslate: drawerTranslateRef.current,
      lastY: touch.clientY,
      lastTime: performance.now(),
      velocity: 0,
    };
    const body = sheetBodyRef.current;
    if (body) body.style.transition = "none";
  }, [isMobileOverlay, surface]);

  const handleDrawerTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobileOverlay || !drawerDragRef.current.active || !isMainSurface(surface)) return;
    const touch = e.touches[0];
    const now = performance.now();
    const dySinceLast = touch.clientY - drawerDragRef.current.lastY;
    const dt = now - drawerDragRef.current.lastTime;
    if (dt > 0) {
      drawerDragRef.current.velocity = (dySinceLast / dt) * 1000;
    }
    drawerDragRef.current.lastY = touch.clientY;
    drawerDragRef.current.lastTime = now;
    const nextTranslate =
      drawerDragRef.current.startTranslate + (touch.clientY - drawerDragRef.current.startY);
    if (e.cancelable) {
      e.preventDefault();
    }
    applyDrawerTranslate(nextTranslate, { immediate: true });
  }, [applyDrawerTranslate, isMobileOverlay, surface]);

  const handleDrawerTouchEnd = useCallback(() => {
    if (!isMobileOverlay || !drawerDragRef.current.active || !isMainSurface(surface)) return;
    drawerDragRef.current.active = false;
    const velocity = drawerDragRef.current.velocity;
    const visibleHeight = drawerHeights.full - drawerTranslateRef.current;
    const snapHeights = [drawerHeights.peek, drawerHeights.full] as const;

    let nextSurface: MainSurface = snapHeights.reduce<MainSurface>((closest, height, index) => {
      const currentDistance = Math.abs(height - visibleHeight);
      const closestDistance = Math.abs(
        (closest === "summary" ? snapHeights[0] : snapHeights[1]) - visibleHeight
      );
      return currentDistance < closestDistance
        ? index === 0
          ? "summary"
          : "detail"
        : closest;
    }, drawerSurface);

    if (velocity < -220) {
      nextSurface = "detail";
    } else if (velocity > 220) {
      nextSurface = "summary";
    }

    setSurface(nextSurface);
    syncDrawerSurface(nextSurface);
  }, [drawerHeights.full, drawerHeights.peek, drawerSurface, isMobileOverlay, surface, syncDrawerSurface]);

  const handleDrawerHandleClick = useCallback(() => {
    if (!isMobileOverlay || !isMainSurface(surface)) return;
    const nextSurface: MainSurface = drawerSurface === "summary" ? "detail" : "summary";
    setSurface(nextSurface);
    syncDrawerSurface(nextSurface);
  }, [drawerSurface, isMobileOverlay, surface, syncDrawerSurface]);

  const handleBackToMain = useCallback(() => {
    const nextSurface = lastMainSurfaceRef.current;
    setSurface(nextSurface);
    const container = scrollContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = mainScrollTopRef.current;
      });
    }
    if (isMobileOverlay) {
      syncDrawerSurface(nextSurface, { immediate: false });
    }
    armInteractionLock(420);
  }, [armInteractionLock, isMobileOverlay, syncDrawerSurface]);

  const handleOpenKotodutePanel = useCallback(() => {
    if (!contentInteractive) return;
    mainScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;
    if (isMainSurface(surface)) {
      lastMainSurfaceRef.current = surface;
    }
    setSurface("kotodute");
    if (isMobileOverlay) {
      syncDrawerSurface("detail");
    }
  }, [contentInteractive, isMobileOverlay, surface, syncDrawerSurface]);

  const handleOpenAiPanel = useCallback(() => {
    if (!contentInteractive) return;
    mainScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;
    if (isMainSurface(surface)) {
      lastMainSurfaceRef.current = surface;
    }
    setSurface("ai");
    if (isMobileOverlay) {
      syncDrawerSurface("detail");
    }
  }, [contentInteractive, isMobileOverlay, surface, syncDrawerSurface]);

  useEffect(() => {
    if (!isMobileOverlay) return;
    const updateDrawerHeights = () => {
      const nextHeights = getDrawerHeights();
      setDrawerHeights(nextHeights);
      // ref から読むことで stale closure / 循環依存を回避
      const nextSurface = drawerSurfaceRef.current;
      drawerTranslateRef.current = getDrawerTranslateForSurface(nextSurface, nextHeights);
      const body = sheetBodyRef.current;
      if (body) {
        body.style.transition = "none";
        body.style.transform = `translate3d(0, ${drawerTranslateRef.current}px, 0)`;
      }
    };
    updateDrawerHeights();
    window.addEventListener("resize", updateDrawerHeights);
    return () => window.removeEventListener("resize", updateDrawerHeights);
  }, [getDrawerHeights, getDrawerTranslateForSurface, isMobileOverlay]);

  useEffect(() => {
    if (!isMobileOverlay || !isMainSurface(surface)) return;
    onMobileMainSurfaceChange?.(surface);
  }, [isMobileOverlay, onMobileMainSurfaceChange, surface]);

  // useLayoutEffect で paint 前に同期的にDOMを更新 → 初回フラッシュを防ぐ
  // applyDrawerTranslate / drawerHeights を deps に入れない → 循環依存を断ち切る
  useLayoutEffect(() => {
    if (!isMobileOverlay) return;
    const nextSurface: MainSurface = initialMobileSurface;
    lastMainSurfaceRef.current = nextSurface;
    drawerSurfaceRef.current = nextSurface;
    setDrawerSurface(nextSurface);
    setSurface(nextSurface);
    const heights = getDrawerHeights();
    setDrawerHeights(heights);
    const expandedTranslate = getDrawerTranslateForSurface(nextSurface, heights);
    drawerTranslateRef.current = expandedTranslate;

    const body = sheetBodyRef.current;
    if (!body) return;

    // ① ペイント前にパネルを完全に画面外（下）に配置
    body.style.transition = "none";
    body.style.transform = `translate3d(0, ${heights.full}px, 0)`;

    // ② ペイント後、展開位置へスライドアップ（下から登場するアニメーション）
    const rafId = requestAnimationFrame(() => {
      body.style.transition = "transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      body.style.transform = `translate3d(0, ${expandedTranslate}px, 0)`;
    });

    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMobileSurface, isMobileOverlay, openNonce, shop.id]);

  useEffect(() => {
    return () => {
      if (drawerRafRef.current !== null) {
        cancelAnimationFrame(drawerRafRef.current);
      }
    };
  }, []);

  // ─── Theme ──────────────────────────────────────────────────────────────────
  const themeKey: ThemeKey = (shop.themeColor as ThemeKey) ?? "amber";
  const theme = THEME_PRESETS[themeKey] ?? THEME_PRESETS.amber;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className={
        isInline
          ? "relative min-h-[calc(100vh-7.5rem)]"
          // Mobile: bottom sheet / Desktop: side panel
          // peek 状態ではバックドロップを透明＆pointer-events-none にしてマップを操作可能にする
          : `fixed inset-0 z-[2000] flex flex-col items-end justify-end md:items-stretch md:justify-center md:!pb-0${
              isMobileOverlay && surface === "summary"
                ? " bg-transparent backdrop-blur-none pointer-events-none"
                : " bg-black/40 backdrop-blur-[2px] md:bg-slate-900/20 md:backdrop-blur-none"
            }`
      }
      style={isInline ? undefined : {
        right: "var(--desktop-menu-offset, 0px)",
        paddingBottom: `calc(${bottomNavOffsetPx}px + var(--safe-bottom, 0px))`,
      }}
    >
      {/* ── Panel container (overflow-hidden for slide rail) ───────────────── */}
      <div
        ref={sheetBodyRef}
        className={`
          relative w-full overflow-hidden bg-white flex flex-col pointer-events-auto
          ${isMobileOverlay ? "will-change-transform" : ""}
          ${isInline
            ? "h-[100vh] border-l border-slate-100 shadow-sm"
            : isMobileOverlay
              ? "rounded-t-3xl shadow-2xl"
              : `
                h-[100vh] w-[520px] max-w-[520px]
                rounded-none border-l border-slate-100
              `
          }
          ${originRect && !isInline && !isMobileOverlay ? "shop-banner-animate" : ""}
        `}
        style={isInline ? undefined : {
          ...bannerStyle,
          ...(isMobileOverlay
            ? { height: `${drawerHeights.full}px`, maxHeight: `${drawerHeights.full}px` }
            : { height: `calc(100vh - ${bottomNavOffsetPx}px)` }),
        }}
      >
        {!isMobileOverlay && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white shadow backdrop-blur-sm transition hover:bg-black/50"
            type="button"
            aria-label="閉じる"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}

          {showMobileSummaryHeader && (
            <div
              className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-white px-4 pb-3 pt-2 touch-none"
              style={{ height: `${DRAWER_PEEK_HEIGHT}px` }}
              onTouchStart={handleDrawerTouchStart}
              onTouchMove={handleDrawerTouchMove}
              onTouchEnd={handleDrawerTouchEnd}
              onTouchCancel={handleDrawerTouchEnd}
            >
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleDrawerHandleClick}
                  className="flex h-8 w-16 items-center justify-center"
                  aria-label="ドロワーを展開"
                >
                  <span className="h-1.5 w-10 rounded-full bg-slate-300" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200"
                type="button"
                aria-label="閉じる"
              >
                <XIcon className="h-4 w-4" />
              </button>
              <ShopBannerHero
                shop={shop}
                bannerImage={bannerImage}
                theme={theme}
                heroImageError={heroImageError}
                onImageError={() => setHeroImageError(true)}
                mode="compact"
                isKotodute={isKotodute}
                showProductPreview
                couponStatus={couponStatus}
                primaryCouponSetting={primaryCouponSetting}
              />
            </div>
          )}

          {showMobileDetailControls && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-center px-4 pt-3">
              <button
                type="button"
                onClick={handleDrawerHandleClick}
                className="pointer-events-auto flex h-8 w-16 items-center justify-center"
                aria-label="ドロワーをたたむ"
                onTouchStart={handleDrawerTouchStart}
                onTouchMove={handleDrawerTouchMove}
                onTouchEnd={handleDrawerTouchEnd}
                onTouchCancel={handleDrawerTouchEnd}
              >
                <span className="h-1.5 w-10 rounded-full bg-white/80 shadow-sm backdrop-blur-sm" />
              </button>
              <button
                onClick={handleDrawerHandleClick}
                className="pointer-events-auto absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white shadow backdrop-blur-sm transition hover:bg-black/50"
                type="button"
                aria-label="展開をたたむ"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="relative flex-1 overflow-hidden">
            {/* ── Slide rail (2 panels: main + kotodute) ─────────────────────── */}
            <div
              className={`flex h-full transition-transform duration-300 ease-in-out ${
                contentInteractive ? "pointer-events-auto" : "pointer-events-none"
              }`}
              style={{
                width: "200%",
                transform: surface === "kotodute" ? "translateX(-50%)" : "translateX(0)",
              }}
            >
              {/* ── Main panel ─────────────────────────────────────────────── */}
              <div
                ref={scrollContainerRef}
                className={`h-full w-1/2 overflow-y-auto ${isInline ? "px-0 pb-16 pt-0" : isMobileOverlay ? "pb-10" : "pb-10 md:pb-16"}`}
              >
        {/* ══════════════════════════════════════════════════════════════════
            HERO — Full-bleed cover with gradient overlay
        ══════════════════════════════════════════════════════════════════ */}
        {!isMobileOverlay && (
          <ShopBannerHero
            shop={shop}
            bannerImage={bannerImage}
            theme={theme}
            heroImageError={heroImageError}
            onImageError={() => setHeroImageError(true)}
            mode="expanded"
            isKotodute={isKotodute}
            onEdit={canEditShop ? handleEditShop : undefined}
          />
        )}

        {isExpandedMobileMain && (
          <div className="px-5 pt-4">
            <ShopBannerHero
              shop={shop}
              bannerImage={bannerImage}
              theme={theme}
              heroImageError={heroImageError}
              onImageError={() => setHeroImageError(true)}
              mode="expanded"
              isKotodute={isKotodute}
            />
          </div>
        )}

        {/* ── Accent color bar ─────────────────────────────────────────────── */}
        <div className="h-1 w-full" style={{ backgroundColor: theme.accent }} />

        {!isKotodute && isMobileOverlay && (
          <div className="space-y-4 px-5 pt-6">
            {canNavigateBetweenShops && totalShopCount > 1 && (
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSelectPreviousShop}
                    className="flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    前の店
                  </button>
                  <div className="min-w-0 flex-1 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      他のお店に
                    </p>
                    <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
                      {selectedShopPosition} / {totalShopCount}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onSelectNextShop}
                    className="flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    次の店
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <ShopBusinessInfoCard shop={shop} theme={theme} />

            <div className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <div className="space-y-5">
                {activePosts.length > 0 && (
                  <BannerActivePostsCard
                    activePosts={activePosts}
                    theme={theme}
                    currentPostIndex={currentPostIndex}
                    isActivePostCentered={isActivePostCentered}
                    activePostRef={activePostRef}
                    activePostCarouselRef={activePostCarouselRef}
                  />
                )}

                {/* ── クーポンカード（モバイル detail） ─────────────── */}
                {!isKotodute && primaryCouponSetting && couponStatus && (
                  <CouponInfoCard
                    setting={primaryCouponSetting}
                    allSettings={couponInfo!.settings}
                    couponStatus={couponStatus}
                    activeCouponTypeId={activeCouponTypeId}
                  />
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme.text }}>
                        商品
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        品ぞろえと価格を並びで見比べやすくしています
                      </p>
                    </div>
                    {shop.products.length > 0 && (
                      <button
                        type="button"
                        onClick={handleBagClick}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        買い物リスト
                      </button>
                    )}
                  </div>
                  {shop.products.length > 0 ? (
                    <div className="space-y-2.5">
                      {shop.products.map((product) => {
                        const specificKey = buildBagKey(product, shop.id);
                        const anyKey = buildBagKey(product, undefined);
                        const isInBag = bagProductKeys.has(specificKey) || bagProductKeys.has(anyKey);
                        const price = shop.productPrices?.[product] ?? null;
                        const productImage = productDetailsByName.get(product.trim().toLowerCase())?.imageUrl;
                        return (
                          <div
                            key={product}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                          >
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
                              {productImage ? (
                                <Image
                                  src={productImage}
                                  alt={`${product}の写真`}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[11px] font-semibold text-slate-400">
                                  画像
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">{product}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {price != null ? `¥${price.toLocaleString()}` : "価格は現地で確認"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleProductTap(product)}
                              className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${
                                isInBag
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-900 text-white"
                              }`}
                            >
                              {isInBag ? "もう一つ" : "追加"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      商品情報は準備中です
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={handleOpenAiPanel}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition hover:opacity-90 active:scale-[0.98]"
                    style={{ borderColor: theme.border, backgroundColor: theme.light }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <Sparkles className="h-[18px] w-[18px] text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: theme.text }}>AI相談</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">他のお店と迷った時も相談できます</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenKotodutePanel}
                    className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition hover:opacity-90 active:scale-[0.98]"
                    style={{ borderColor: theme.border }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: theme.bg }}
                    >
                      <MessageSquarePlus className="h-[18px] w-[18px]" style={{ color: theme.accent }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: theme.text }}>ことづて</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {kotoduteNotes.length > 0 ? `${kotoduteNotes.length}件のコメント` : "他の人の感想を見る"}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PRODUCTS — 商品と値段（ヒーロー直下に移動）
        ══════════════════════════════════════════════════════════════════ */}
        {!isKotodute && !isMobileOverlay && shop.products.length > 0 && (
          <div className="px-5 pt-4 pb-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.text }}>
                商品
              </p>
              <button
                type="button"
                onClick={handleBagClick}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                買い物リスト
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {shop.products.map((product) => {
                const specificKey = buildBagKey(product, shop.id);
                const anyKey = buildBagKey(product, undefined);
                const isInBag = bagProductKeys.has(specificKey) || bagProductKeys.has(anyKey);
                const price = shop.productPrices?.[product] ?? null;
                return (
                  <button
                    key={product}
                    type="button"
                    onClick={() => handleProductTap(product)}
                    className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md ${
                      isInBag
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>{product}</span>
                    {price != null && (
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${isInBag ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        ¥{price.toLocaleString()}
                      </span>
                    )}
                    {isInBag && <span className="text-emerald-500">✓</span>}
                  </button>
                );
              })}
            </div>
            {shop.category === "食材" && suggestedRecipes.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400">この食材で作れるレシピ</p>
                {suggestedRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm transition hover:bg-slate-50"
                  >
                    {recipe.heroImage && (
                      <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg">
                        <Image src={recipe.heroImage} alt={recipe.title} width={112} height={96} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{recipe.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{recipe.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            IDENTITY — Owner, location, quick info
        ══════════════════════════════════════════════════════════════════ */}
        {!isKotodute && !isMobileOverlay && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {shop.chome ?? "丁目未設定"}
              </span>
              <span>{shop.ownerName}</span>
            </div>

            <div className="mt-3">
              <ShopBusinessInfoCard shop={shop} theme={theme} />
            </div>

            {/* SNS links */}
            <div className="mt-3 flex flex-wrap gap-2">
              {shop.socialLinks?.instagram && (
                <a
                  href={shop.socialLinks.instagram.startsWith("http") ? shop.socialLinks.instagram : `https://instagram.com/${shop.socialLinks.instagram.replace(/^@/, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700 transition hover:bg-pink-100"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  Instagram
                </a>
              )}
              {shop.socialLinks?.twitter && (
                <a
                  href={shop.socialLinks.twitter.startsWith("http") ? shop.socialLinks.twitter : `https://x.com/${shop.socialLinks.twitter.replace(/^@/, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  𝕏
                </a>
              )}
              {shop.socialLinks?.website && (
                <a
                  href={shop.socialLinks.website.startsWith("http") ? shop.socialLinks.website : `https://${shop.socialLinks.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                >
                  <Globe className="h-3.5 w-3.5" />
                  サイト
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        {!isMobileOverlay && <div className="mx-5 my-3 border-t border-slate-100" />}

        <div className={`px-5 ${isMobileOverlay ? "pb-8 pt-6 space-y-7" : "pb-6 space-y-6"}`}>

          {/* ════════════════════════════════════════════════════════════════
              COUPON — 参加・使えるクーポン情報
          ════════════════════════════════════════════════════════════════ */}
          {!isKotodute && !isMobileOverlay && primaryCouponSetting && couponStatus && (
            <CouponInfoCard
              setting={primaryCouponSetting}
              allSettings={couponInfo!.settings}
              couponStatus={couponStatus}
              activeCouponTypeId={activeCouponTypeId}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════
              TODAY'S ANNOUNCEMENT — Rich card
          ════════════════════════════════════════════════════════════════ */}
          {!isKotodute && activePosts.length > 0 && !isMobileOverlay && (
            <BannerActivePostsCard
              activePosts={activePosts}
              theme={theme}
              currentPostIndex={currentPostIndex}
              isActivePostCentered={isActivePostCentered}
              activePostRef={activePostRef}
              activePostCarouselRef={activePostCarouselRef}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════
              SHOP STORY — こだわり with grandma character
          ════════════════════════════════════════════════════════════════ */}
          {!isKotodute && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.text }}>
                お店のこだわり
              </p>
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <Image
                    src="/images/obaasan_transparent.png"
                    alt="おせっかいばあちゃん"
                    width={60}
                    height={60}
                    className="h-14 w-14 opacity-80"
                  />
                </div>
                <div
                  className="relative w-full rounded-2xl border px-4 py-3 text-sm leading-relaxed text-slate-700"
                  style={{ borderColor: theme.border, backgroundColor: theme.bg }}
                >
                  <span className="absolute -left-2 top-4 h-3.5 w-3.5 rotate-45 border-b border-l" style={{ borderColor: theme.border, backgroundColor: theme.bg }} aria-hidden />
                  <span className="font-semibold">{shop.shopStrength?.trim() || OSEKKAI_FALLBACK}</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STALL INFO — Style, payment, hours
          ════════════════════════════════════════════════════════════════ */}
          {!isKotodute && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4">
              {/* Style tags */}
              {((shop.stallStyleTags ?? []).length > 0 || shop.stallStyle || shop.schedule) && (
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">出店スタイル</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(shop.stallStyleTags ?? []).map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">{tag}</span>
                    ))}
                    {shop.stallStyle && <span className="text-sm text-slate-600">{shop.stallStyle}</span>}
                  </div>
                  {shop.schedule && <p className="mt-1 text-xs text-slate-500">{shop.schedule}</p>}
                  {shop.rainPolicy && shop.rainPolicy !== "undecided" && (
                    <p className="mt-1 text-xs text-slate-500">
                      {shop.rainPolicy === "outdoor" && "🌧 雨でも出店"}
                      {shop.rainPolicy === "tent" && "⛺ 雨でも出店（テント）"}
                      {shop.rainPolicy === "cancel" && "❌ 雨天中止"}
                    </p>
                  )}
                </div>
              )}

              {/* Payment methods */}
              {(shop.paymentMethods ?? []).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">決済方法</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(shop.paymentMethods ?? []).map((method) => {
                      const labels: Record<string, string> = { cash: "💴 現金", card: "💳 カード", paypay: "📱 PayPay", ic: "🚃 交通系IC" };
                      return (
                        <span key={method} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">{labels[method] ?? method}</span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              AI CONSULT — Dedicated card
          ════════════════════════════════════════════════════════════════ */}
          {!isKotodute && !isMobileOverlay && (
            <button
              type="button"
              onClick={handleOpenAiPanel}
              className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition hover:opacity-90 active:scale-[0.98]"
              style={{ borderColor: theme.border, backgroundColor: theme.light }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.accent }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold" style={{ color: theme.text }}>AIに相談する</p>
                <p className="mt-0.5 text-xs text-slate-500">このお店について何でも聞いてみよう</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          )}

          {/* ════════════════════════════════════════════════════════════════
              KOTODUTE — User comments
          ════════════════════════════════════════════════════════════════ */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.text }}>ことづて</p>
                {kotoduteNotes.length > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: theme.light, color: theme.text }}>
                    {kotoduteNotes.length}
                  </span>
                )}
              </div>
              {kotoduteNotes.length > 0 && (
                <button type="button" onClick={handleOpenKotodutePanel} className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-700">
                  もっと見る
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {kotoduteNotes.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenKotodutePanel}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-4 transition hover:opacity-80 active:scale-[0.98]"
                style={{ borderColor: theme.border, backgroundColor: theme.bg }}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.light }}>
                  <MessageSquarePlus className="h-4 w-4" style={{ color: theme.accent }} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-bold" style={{ color: theme.text }}>一番乗りでコメントしよう！</p>
                  <p className="mt-0.5 text-xs text-slate-500">お店の感想やおすすめを教えてください</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
              </button>
            ) : (
              <div className="space-y-2">
                {kotoduteNotes.slice(0, KOTODUTE_PREVIEW_LIMIT).map((note) => (
                  <div key={note.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {note.text.replace(KOTODUTE_TAG_REGEX, "").trim()}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleOpenKotodutePanel}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition hover:opacity-80"
                  style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }}
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  コメントを投稿する
                </button>
              </div>
            )}
          </div>
          </div>{/* space-y-6 */}
          </div>{/* main panel */}
          {/* ── Kotodute panel ─────────────────────────────────────────── */}
          <div className="h-full w-1/2 overflow-y-auto">
            <KotodutePanel
              shop={shop}
              bannerImage={bannerImage}
              heroImageError={heroImageError}
              theme={theme}
              onBack={handleBackToMain}
              onClose={isMobileOverlay ? onClose : undefined}
            />
          </div>
        </div>

        {/* ── AI panel (absolute overlay, independent of slide rail) ─────── */}
        <div
          className="absolute inset-0 z-20 bg-white transition-transform duration-300 ease-in-out"
          style={{ transform: surface === "ai" ? "translateX(0)" : "translateX(100%)" }}
        >
          <AiConsultPanel
            shop={shop}
            bannerImage={bannerImage}
            heroImageError={heroImageError}
            theme={theme}
            onBack={handleBackToMain}
            onClose={isMobileOverlay ? onClose : undefined}
            isActive={surface === "ai"}
          />
        </div>
          </div>
      </div>

      {/* ── Undo toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[3100] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 shadow-xl text-sm text-white">
          <span>「{toast.product}」を追加しました</span>
          <button
            type="button"
            onClick={() => handleUndoAdd(toast.product)}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold transition hover:bg-white/30"
          >
            取り消す
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Coupon Info Card ─────────────────────────────────────────────────────────
type CouponSetting = {
  coupon_type_id: string;
  coupon_type_name: string;
  coupon_type_emoji: string;
  coupon_type_amount: number;
  min_purchase_amount: number;
};

function CouponInfoCard({
  setting,
  allSettings,
  couponStatus,
  activeCouponTypeId,
}: {
  setting: CouponSetting;
  allSettings: CouponSetting[];
  couponStatus: "active" | "stamped" | "participating";
  activeCouponTypeId?: string;
}) {
  if (couponStatus === "active") {
    return (
      <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{setting.coupon_type_emoji}</span>
          <span className="text-sm font-bold text-green-800">{setting.coupon_type_name}</span>
          <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">
            今すぐ使える
          </span>
        </div>
        <p className="text-2xl font-extrabold text-green-600 mb-0.5">
          {setting.coupon_type_amount.toLocaleString()}円引き
        </p>
        {setting.min_purchase_amount > 0 && (
          <p className="text-xs text-slate-500">
            {setting.min_purchase_amount.toLocaleString()}円以上のご購入で適用
          </p>
        )}
        {allSettings.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allSettings.filter((s) => s.coupon_type_id !== activeCouponTypeId).map((s) => (
              <span
                key={s.coupon_type_id}
                className="rounded-full border border-green-200 bg-white px-2 py-0.5 text-[11px] text-green-700"
              >
                {s.coupon_type_emoji} {s.coupon_type_name}も対応
              </span>
            ))}
          </div>
        )}
        <Link
          href="/coupons"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
        >
          クーポンを確認する
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (couponStatus === "stamped") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{setting.coupon_type_emoji}</span>
          <span className="text-sm font-semibold text-emerald-800">{setting.coupon_type_name}</span>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            ✅ 本日スタンプ済み
          </span>
        </div>
        <p className="mt-1.5 text-xs text-emerald-700">
          本日はこのお店のスタンプを取得済みです
        </p>
      </div>
    );
  }

  // "participating" — クーポンは未保有
  return (
    <div className="rounded-xl border border-dashed border-green-200 bg-green-50/50 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{setting.coupon_type_emoji}</span>
        <span className="text-sm font-semibold text-green-800">
          {setting.coupon_type_name}クーポン対応
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        クーポンページでQRコードを確認できます
      </p>
      <Link
        href="/coupons"
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-green-300 bg-white py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
      >
        クーポンを確認する
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ─── AI Consult Panel ────────────────────────────────────────────────────────
type ChatMsg = { role: "user" | "assistant"; text: string };

const AI_SUGGESTED_PROMPTS = [
  { icon: "🛍️", text: "どんな商品がありますか？" },
  { icon: "⭐", text: "おすすめはなんですか？" },
  { icon: "🕐", text: "何時まで営業していますか？" },
  { icon: "💴", text: "支払いはカードで払えますか？" },
  { icon: "🌧️", text: "雨の日でも出店していますか？" },
];

function AiConsultPanel({
  shop,
  bannerImage,
  heroImageError,
  theme,
  onBack,
  onClose,
  isActive: _isActive,
}: {
  shop: Shop;
  bannerImage: string;
  heroImageError: boolean;
  theme: BannerTheme;
  onBack: () => void;
  onClose?: () => void;
  isActive: boolean;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ショップが変わったらリセット
  useEffect(() => {
    setMessages([]);
    setInput("");
    setStreaming(false);
    abortRef.current?.abort();
  }, [shop.id]);

  // アンマウント時にストリーミングを中断
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // 新メッセージが追加されたら最下部へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // textarea の高さを内容に合わせて自動調整
  const adjustTextarea = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      adjustTextarea(e.target);
    },
    [adjustTextarea]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const history = messages;
      setMessages((prev) => [
        ...prev,
        { role: "user", text: trimmed },
        { role: "assistant", text: "" },
      ]);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setStreaming(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/grandma/shop-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            shopName: shop.name,
            shopContext: {
              category: shop.category,
              catchphrase: shop.catchphrase,
              shopStrength: shop.shopStrength,
              products: shop.products,
              chome: shop.chome,
            },
            history,
            text: trimmed,
          }),
        });
        if (!res.ok || !res.body) throw new Error("upstream error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { ...last, text: last.text + chunk };
            }
            return copy;
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant" && !last.text) {
              copy[copy.length - 1] = {
                ...last,
                text: "ごめんよ、うまく答えられんかったわ…もう一回試してみてね。",
              };
            }
            return copy;
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, shop, streaming]
  );

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const handleSubmit = useCallback(
    () => sendMessage(input),
    [input, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // IME確定中は無視（日本語入力対応）
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isEmpty = messages.length === 0;
  const lastMsg = messages[messages.length - 1];
  const isTyping =
    streaming && lastMsg?.role === "assistant" && !lastMsg.text;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ShopSubviewHeader
        shop={shop}
        bannerImage={bannerImage}
        heroImageError={heroImageError}
        onImageError={() => {}}
        theme={theme}
        title="AIに相談する"
        titleIcon={<Sparkles className="h-3.5 w-3.5" style={{ color: theme.accent }} />}
        onBack={onBack}
        onClose={onClose}
        rightSlot={
          !isEmpty ? (
            <button
              type="button"
              onClick={() => { setMessages([]); setInput(""); }}
              className="text-xs font-semibold text-slate-400 transition hover:text-slate-600 px-2 py-1.5 rounded-full hover:bg-slate-100"
            >
              クリア
            </button>
          ) : undefined
        }
      />

      {/* ── メッセージエリア ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isEmpty ? (
          /* ── ウェルカム画面 ── */
          <div className="flex flex-col items-center px-5 py-6 gap-5">
            {/* キャラクター */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-full shadow-md"
                style={{ backgroundColor: theme.light }}
              >
                <Image
                  src="/images/obaasan_transparent.png"
                  alt="にちよさん"
                  width={56}
                  height={56}
                  className="h-14 w-14 opacity-85"
                />
                {/* ステータスバッジ */}
                <span
                  className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white shadow"
                  style={{ backgroundColor: theme.accent }}
                >
                  AI
                </span>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-slate-800 leading-snug">
                  {shop.name}のことなら何でも！
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  土佐弁で親切にお答えするがよ〜
                </p>
              </div>
            </div>

            {/* 区切り */}
            <div className="flex w-full items-center gap-3">
              <div className="flex-1 border-t border-slate-100" />
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                よく聞かれる質問
              </p>
              <div className="flex-1 border-t border-slate-100" />
            </div>

            {/* サジェストプロンプト */}
            <div className="w-full space-y-2">
              {AI_SUGGESTED_PROMPTS.map(({ icon, text }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => sendMessage(text)}
                  className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:opacity-80 active:scale-[0.98] text-left"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.bg,
                    color: theme.text,
                  }}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span className="flex-1">{text}</span>
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 opacity-40"
                    style={{ color: theme.text }}
                  />
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-300 text-center leading-relaxed">
              AIの回答はお店情報に基づく参考情報です。<br />
              内容の正確性を保証するものではありません。
            </p>
          </div>
        ) : (
          /* ── チャット表示 ── */
          <div className="space-y-3 px-4 py-5 pb-3">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isLastAssistant =
                !isUser && i === messages.length - 1;
              const showTyping = isTyping && isLastAssistant;

              return (
                <div
                  key={i}
                  className={`flex items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* アシスタントアバター */}
                  {!isUser && (
                    <div
                      className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                      style={{ backgroundColor: theme.light }}
                    >
                      <Image
                        src="/images/obaasan_transparent.png"
                        alt="にちよさん"
                        width={24}
                        height={24}
                        className="h-6 w-6 opacity-85"
                      />
                    </div>
                  )}

                  {/* バブル */}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "rounded-br-sm bg-slate-900 text-white"
                        : "rounded-bl-sm border text-slate-800"
                    }`}
                    style={
                      !isUser
                        ? {
                            borderColor: theme.border,
                            backgroundColor: theme.bg,
                          }
                        : undefined
                    }
                  >
                    {showTyping ? (
                      /* タイピングインジケーター */
                      <span className="inline-flex items-center gap-1 py-0.5 px-0.5">
                        {[0, 160, 320].map((delay) => (
                          <span
                            key={delay}
                            className="h-2 w-2 rounded-full animate-bounce"
                            style={{
                              backgroundColor: theme.accent,
                              animationDelay: `${delay}ms`,
                              opacity: 0.7,
                            }}
                          />
                        ))}
                      </span>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* スクロール追従用アンカー */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── 入力エリア ────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-t bg-white px-3 pt-2 pb-3"
        style={{ borderColor: theme.border }}
      >
        {/* 生成停止ボタン（ストリーミング中のみ） */}
        {streaming && (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={handleAbort}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: theme.accent }}
              />
              生成を停止
            </button>
          </div>
        )}

        {/* テキストエリア + 送信ボタン */}
        <div
          className="flex items-end gap-2 rounded-2xl border bg-slate-50 px-3.5 py-2.5 transition-shadow focus-within:shadow-md focus-within:bg-white"
          style={{ borderColor: theme.border }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              streaming ? "回答中…" : "質問を入力（Shift+Enterで改行）"
            }
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              lineHeight: "1.5",
              maxHeight: 120,
              overflowY: "auto",
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || streaming}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow transition disabled:opacity-30 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: theme.accent }}
            aria-label="送信"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kotodute characters ──────────────────────────────────────────────────────
const KOTODUTE_CHARACTERS = [
  { id: "sakura", emoji: "🌸", name: "さくら" },
  { id: "kon",    emoji: "🦊", name: "こん" },
  { id: "nami",   emoji: "🌊", name: "なみ" },
  { id: "shiro",  emoji: "🏯", name: "しろ" },
] as const;
type KotoduteCharacterId = typeof KOTODUTE_CHARACTERS[number]["id"];
const CHAR_STORAGE_KEY = "nicchyo-kotodute-character";

// ─── Kotodute Panel (2nd slide) ───────────────────────────────────────────────
function KotodutePanel({
  shop,
  bannerImage,
  heroImageError,
  theme,
  onBack,
  onClose,
}: {
  shop: Shop;
  bannerImage: string;
  heroImageError: boolean;
  theme: BannerTheme;
  onBack: () => void;
  onClose?: () => void;
}) {
  const [allNotes, setAllNotes] = useState<KotoduteNote[]>([]);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<KotoduteCharacterId>(() => {
    if (typeof window === "undefined") return "sakura";
    return (localStorage.getItem(CHAR_STORAGE_KEY) as KotoduteCharacterId) ?? "sakura";
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedChar = KOTODUTE_CHARACTERS.find((c) => c.id === selectedCharId) ?? KOTODUTE_CHARACTERS[0];

  const notes = useMemo(
    () =>
      allNotes
        .filter((n) => n.shopId === shop.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [allNotes, shop.id]
  );

  useEffect(() => {
    setAllNotes(loadKotodute());
    setText("");
    setSubmitted(false);
  }, [shop.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setAllNotes(loadKotodute());
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "nicchyo-kotodute-notes") handler();
    };
    window.addEventListener(KOTODUTE_UPDATED_EVENT, handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(KOTODUTE_UPDATED_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const handleCharSelect = useCallback((id: KotoduteCharacterId) => {
    setSelectedCharId(id);
    localStorage.setItem(CHAR_STORAGE_KEY, id);
  }, []);

  const handleSubmit = useCallback(() => {
    const body = text.trim();
    if (!body) return;
    const next: KotoduteNote = {
      id: crypto.randomUUID(),
      shopId: shop.id,
      text: body,
      createdAt: Date.now(),
      authorEmoji: selectedChar.emoji,
    };
    const updated = [next, ...loadKotodute()];
    saveKotodute(updated);
    setAllNotes(updated);
    setText("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }, [text, shop.id, selectedChar]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
    },
    [handleSubmit]
  );

  return (
    <div className="flex h-full flex-col">
      <ShopSubviewHeader
        shop={shop}
        bannerImage={bannerImage}
        heroImageError={heroImageError}
        onImageError={() => {}}
        theme={theme}
        title="ことづて"
        onBack={onBack}
        onClose={onClose}
        rightSlot={
          notes.length > 0 ? (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: theme.light, color: theme.text }}
            >
              {notes.length}
            </span>
          ) : undefined
        }
      />

      {/* ── Compose area ────────────────────────────────────────────────────── */}
      <div className="border-b px-4 py-4" style={{ borderColor: theme.border }}>
        {/* Character selector */}
        <div className="mb-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.text }}>
            投稿キャラを選ぶ
          </p>
          <div className="flex gap-2">
            {KOTODUTE_CHARACTERS.map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => handleCharSelect(char.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${
                  selectedCharId === char.id
                    ? "shadow-sm ring-2"
                    : "opacity-50 hover:opacity-80"
                }`}
                style={{
                  backgroundColor: selectedCharId === char.id ? theme.light : "transparent",
                  border: `1px solid ${theme.border}`,
                  ...(selectedCharId === char.id ? { outline: `2px solid ${theme.accent}`, outlineOffset: "1px" } : {}),
                }}
              >
                <span className="text-xl leading-none">{char.emoji}</span>
                <span style={{ color: theme.text }}>{char.name}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mb-2 text-xs font-semibold" style={{ color: theme.text }}>
          {shop.name}へひとことメモ
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="おすすめや感想をひとこと…"
          rows={3}
          className="w-full resize-none rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:bg-white focus:outline-none focus:ring-2"
          style={{
            borderColor: theme.border,
            // @ts-ignore
            "--tw-ring-color": theme.accent + "55",
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: submitted ? "#22c55e" : theme.accent }}
        >
          {submitted ? (
            "✓ 投稿しました！"
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              投稿する
            </>
          )}
        </button>
      </div>

      {/* ── Notes list ──────────────────────────────────────────────────────── */}
      {notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.light }}
          >
            <MessageSquarePlus className="h-6 w-6" style={{ color: theme.accent }} />
          </div>
          <p className="text-sm font-bold text-slate-700">まだコメントがありません</p>
          <p className="text-xs text-slate-400">最初の一言を投稿してみましょう！</p>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xl shadow-sm"
                style={{ backgroundColor: theme.light, border: `1.5px solid ${theme.border}` }}
              >
                {note.authorEmoji ?? "💬"}
              </div>
              <div
                className="flex-1 rounded-2xl border px-3 py-2.5 text-sm"
                style={{ borderColor: theme.border, backgroundColor: theme.bg }}
              >
              <p className="leading-relaxed text-slate-800">
                {note.text.replace(KOTODUTE_TAG_REGEX, "").trim()}
              </p>
              <p className="mt-1.5 text-[11px]" style={{ color: theme.text, opacity: 0.6 }}>
                {formatRelativeTime(note.createdAt)}
              </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
