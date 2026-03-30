// app/(public)/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  MapPin,
  ShoppingBag,
  Clock,
  ChevronRight,
  Sparkles,
  Instagram,
  Globe,
  X as XIcon,
  Pencil,
} from "lucide-react";
import { Shop } from "../data/shops";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "../../../../lib/auth/AuthContext";
import { getShopBannerImage } from "../../../../lib/shopImages";
import { useBag } from "../../../../lib/storage/BagContext";
import { ingredientCatalog, recipes } from "../../../../lib/recipes";
import {
  KOTODUTE_UPDATED_EVENT,
  loadKotodute,
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

// ─── Types ────────────────────────────────────────────────────────────────────
type ShopDetailBannerProps = {
  shop: Shop;
  bagCount?: number;
  onClose?: () => void;
  onAddToBag?: (name: string, fromShopId?: number) => void;
  variant?: "default" | "kotodute";
  originRect?: { x: number; y: number; width: number; height: number };
  layout?: "overlay" | "inline";
};

type BagItem = {
  name: string;
  fromShopId?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "nicchyo-fridge-items";
const KOTODUTE_PREVIEW_LIMIT = 3;
const KOTODUTE_TAG_REGEX = /\s*#\d+|\s*#all/gi;
const OSEKKAI_FALLBACK =
  "あら、ここのお店、最近行ってないねぇ。今日は何が出ちゅうか、ちょっと見てきてくれん？";

const buildBagKey = (name: string, shopId?: number) =>
  `${name.trim().toLowerCase()}-${shopId ?? "any"}`;

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

// ─── Category fallback ────────────────────────────────────────────────────────
const CATEGORY_FALLBACK: Record<string, { emoji: string; gradient: string }> = {
  "食材":     { emoji: "🥦", gradient: "bg-gradient-to-br from-emerald-100 to-green-200" },
  "加工食品": { emoji: "🍱", gradient: "bg-gradient-to-br from-amber-100 to-orange-200" },
  "工芸品":   { emoji: "🎨", gradient: "bg-gradient-to-br from-purple-100 to-indigo-200" },
  "植物":     { emoji: "🌿", gradient: "bg-gradient-to-br from-green-100 to-emerald-200" },
  "飲食":     { emoji: "🍜", gradient: "bg-gradient-to-br from-orange-100 to-red-200" },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShopDetailBanner({
  shop,
  bagCount,
  onClose,
  onAddToBag,
  variant = "default",
  originRect,
  layout = "overlay",
}: ShopDetailBannerProps) {
  const router = useRouter();
  const { permissions } = useAuth();
  const { addItem, removeItem, items: bagContextItems } = useBag();
  const [bagProductKeys, setBagProductKeys] = useState<Set<string>>(new Set());
  const [kotoduteNotes, setKotoduteNotes] = useState<KotoduteNote[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [heroImageError, setHeroImageError] = useState(false);
  const [toast, setToast] = useState<{ product: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activePostRef = useRef<HTMLDivElement | null>(null);
  const activePostCarouselRef = useRef<HTMLDivElement | null>(null);

  // body scroll lock
  useEffect(() => {
    if (layout !== "overlay" || typeof document === "undefined") return;
    document.body.classList.add("shop-banner-open");
    return () => { document.body.classList.remove("shop-banner-open"); };
  }, [layout]);

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
  }, [shop.id]);

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
  const consultHref = `/consult?shopId=${shop.id}&shopName=${encodeURIComponent(shop.name)}&q=${encodeURIComponent("このお店のおすすめやこだわりを詳しく教えて")}`;
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

  const shopNameSizeClass = useMemo(() => {
    const length = shop.name?.length ?? 0;
    if (length >= 18) return "text-2xl";
    if (length >= 14) return "text-3xl";
    return "text-4xl";
  }, [shop.name]);

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
    return [];
  }, [shop.activePost, shop.activePosts]);

  useEffect(() => {
    setCurrentPostIndex(0);
    setHeroImageError(false);
    setToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, [shop.id]);

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
          : "fixed inset-0 z-[2000] flex flex-col items-end justify-end bg-black/40 backdrop-blur-[2px] md:items-stretch md:justify-center md:bg-slate-900/20 md:backdrop-blur-none"
      }
      style={isInline ? undefined : { right: "var(--desktop-menu-offset, 0px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      {/* ── Scroll container ────────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className={`
          relative w-full overflow-y-auto bg-white
          ${isInline
            ? "h-[calc(100vh-3.5rem)] border-l border-slate-100 px-0 pb-16 pt-0 shadow-sm"
            : `
              /* Mobile: bottom sheet — rounded top, max 90vh */
              max-h-[90vh] rounded-t-3xl pb-10 shadow-2xl
              /* Desktop: right side panel */
              md:h-[calc(100vh-3.5rem)] md:max-h-none md:w-[520px] md:max-w-[520px]
              md:rounded-none md:border-l md:border-slate-100 md:pb-16
              md:pointer-events-auto
            `
          }
          ${originRect && !isInline ? "shop-banner-animate" : ""}
        `}
        style={isInline ? undefined : bannerStyle}
      >
        {/* ── Drag handle (mobile only) ────────────────────────────────────── */}
        {!isInline && (
          <div className="sticky top-0 z-30 flex justify-center pb-1 pt-3 md:hidden">
            <div className="h-1 w-10 rounded-full bg-slate-300" />
          </div>
        )}

        {/* ── Close button ─────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white shadow backdrop-blur-sm transition hover:bg-black/50"
          type="button"
          aria-label="閉じる"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* ══════════════════════════════════════════════════════════════════
            HERO — Full-bleed cover with gradient overlay
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative h-56 w-full overflow-hidden md:h-64">
          {heroImageError ? (
            <div className={`flex h-full w-full items-center justify-center ${CATEGORY_FALLBACK[shop.category ?? ""]?.gradient ?? "bg-gradient-to-br from-slate-100 to-slate-200"}`}>
              <span className="text-7xl">{CATEGORY_FALLBACK[shop.category ?? ""]?.emoji ?? "🏪"}</span>
            </div>
          ) : (
            <Image
              src={bannerImage}
              alt={`${shop.name}の写真`}
              fill
              className="object-cover object-center"
              priority
              onError={() => setHeroImageError(true)}
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Shop name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className={`font-extrabold leading-tight text-white drop-shadow-md ${shopNameSizeClass}`}>
                  {shop.name}
                </h2>
                {!isKotodute && shop.catchphrase && (
                  <p className="mt-1 text-sm font-medium text-white/80 drop-shadow">
                    {shop.catchphrase}
                  </p>
                )}
              </div>
              {!isKotodute && canEditShop && (
                <button
                  type="button"
                  onClick={handleEditShop}
                  className="shrink-0 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  <Pencil className="h-3 w-3" />
                  編集
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Accent color bar ─────────────────────────────────────────────── */}
        <div className="h-1 w-full" style={{ backgroundColor: theme.accent }} />

        {/* ══════════════════════════════════════════════════════════════════
            PRODUCTS — 商品と値段（ヒーロー直下に移動）
        ══════════════════════════════════════════════════════════════════ */}
        {!isKotodute && shop.products.length > 0 && (
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
        {!isKotodute && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {shop.chome ?? "丁目未設定"}
              </span>
              <span>{shop.ownerName}</span>
              {(shop.businessHoursStart || shop.businessHoursEnd) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {shop.businessHoursStart ?? "—"} 〜 {shop.businessHoursEnd ?? "—"}
                </span>
              )}
            </div>

            {/* SNS / AI quick links */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={consultHref}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: theme.light, color: theme.text, borderColor: theme.border }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AIに詳しく聞く
              </Link>
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
        <div className="mx-5 my-3 border-t border-slate-100" />

        <div className="px-5 pb-6 space-y-6">

          {/* ════════════════════════════════════════════════════════════════
              TODAY'S ANNOUNCEMENT — Rich card
          ════════════════════════════════════════════════════════════════ */}
          {!isKotodute && activePosts.length > 0 && (
            <div ref={activePostRef} className={`overflow-hidden rounded-2xl border shadow-sm ${isActivePostCentered ? "center-bounce-in" : ""}`} style={{ borderColor: theme.border }}>
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: theme.light }}>
                <span className="text-base">📢</span>
                <span className="text-sm font-bold" style={{ color: theme.text }}>今日のお知らせ</span>
                {activePosts.length > 1 && (
                  <div className="ml-auto flex gap-1">
                    {activePosts.map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full transition-colors" style={{ backgroundColor: i === currentPostIndex ? theme.accent : theme.border }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Carousel */}
              <div ref={activePostCarouselRef} className="flex snap-x snap-mandatory overflow-x-hidden scroll-smooth">
                {activePosts.map((post, index) => (
                  <article key={`${shop.id}-${post.createdAt || post.expiresAt}-${index}`} className="w-full shrink-0 snap-center">
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
                            {new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(post.createdAt))}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
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
              KOTODUTE — User comments
          ════════════════════════════════════════════════════════════════ */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.text }}>ことづて</p>
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: theme.light, color: theme.text }}>
                  {kotoduteNotes.length}
                </span>
              </div>
              <Link href={`/kotodute?shopId=${shop.id}`} className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-700">
                投稿・もっと読む
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {kotoduteNotes.length === 0 ? (
              <EmptyState
                icon={MessageSquarePlus}
                title="一番乗りでコメントしよう！"
                description={<>まだ投稿がありません。<br />お店の感想やおすすめを教えてください。</>}
                action={
                  <Link href={`/kotodute?shopId=${shop.id}`} className="rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: theme.accent }}>
                    投稿する
                  </Link>
                }
                className="mt-3"
                variant="amber"
              />
            ) : (
              <div className="space-y-2">
                {kotoduteNotes.slice(0, KOTODUTE_PREVIEW_LIMIT).map((note) => (
                  <div key={note.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {note.text.replace(KOTODUTE_TAG_REGEX, "").trim()}
                  </div>
                ))}
              </div>
            )}
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
