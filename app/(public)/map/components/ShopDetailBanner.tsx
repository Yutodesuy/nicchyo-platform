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
  ArrowLeft,
  Send,
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
}: ShopDetailBannerProps) {
  const router = useRouter();
  const { permissions } = useAuth();
  const { addItem, removeItem, items: bagContextItems } = useBag();
  const [bagProductKeys, setBagProductKeys] = useState<Set<string>>(new Set());
  const [kotoduteNotes, setKotoduteNotes] = useState<KotoduteNote[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [heroImageError, setHeroImageError] = useState(false);
  const [toast, setToast] = useState<{ product: string } | null>(null);
  const [activePanel, setActivePanel] = useState<"main" | "kotodute" | "ai">("main");
  const [contentInteractive, setContentInteractive] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setActivePanel("main");
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    armInteractionLock();
    return () => {
      if (interactionLockTimerRef.current) clearTimeout(interactionLockTimerRef.current);
    };
  }, [armInteractionLock, shop.id, openNonce]);

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
  const handleBackToMain = useCallback(() => {
    setActivePanel("main");
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
    armInteractionLock(420);
  }, [armInteractionLock]);
  const handleOpenAiPanel = useCallback(() => {
    if (!contentInteractive) return;
    setActivePanel("ai");
  }, [contentInteractive]);
  const handleOpenKotodutePanel = useCallback(() => {
    if (!contentInteractive) return;
    setActivePanel("kotodute");
  }, [contentInteractive]);

  // スワイプダウンで閉じる (モバイル bottom-sheet のみ)
  const swipeStartY = useRef<number | null>(null);
  const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    if (isInline) return;
    swipeStartY.current = e.touches[0].clientY;
  }, [isInline]);
  const handleSwipeTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isInline || swipeStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
    if (dy > 80 && scrollTop <= 0) onClose?.();
    swipeStartY.current = null;
  }, [isInline, onClose]);

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
      {/* ── Panel container (overflow-hidden for slide rail) ───────────────── */}
      <div
        className={`
          relative w-full overflow-hidden bg-white
          ${isInline
            ? "h-[calc(100vh-3.5rem)] border-l border-slate-100 shadow-sm"
            : `
              h-[90vh] rounded-t-3xl shadow-2xl
              md:h-[calc(100vh-3.5rem)] md:w-[520px] md:max-w-[520px]
              md:rounded-none md:border-l md:border-slate-100
              md:pointer-events-auto
            `
          }
          ${originRect && !isInline ? "shop-banner-animate" : ""}
        `}
        style={isInline ? undefined : bannerStyle}
      >
        {/* ── Close button (always visible above both panels) ──────────────── */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white shadow backdrop-blur-sm transition hover:bg-black/50"
          type="button"
          aria-label="閉じる"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* ── Slide rail (3 panels) ───────────────────────────────────────── */}
        <div
          className={`flex h-full transition-transform duration-300 ease-in-out ${
            contentInteractive ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={{
            width: "300%",
            transform:
              activePanel === "kotodute" ? "translateX(calc(-100% / 3))"
              : activePanel === "ai"     ? "translateX(calc(-200% / 3))"
              : "translateX(0)",
          }}
        >
          {/* ── Main panel ─────────────────────────────────────────────── */}
          <div
            ref={scrollContainerRef}
            onTouchStart={handleSwipeTouchStart}
            onTouchEnd={handleSwipeTouchEnd}
            className={`h-full w-1/3 overflow-y-auto ${isInline ? "px-0 pb-16 pt-0" : "pb-10 md:pb-16"}`}
          >
            {/* ── Drag handle (mobile only) ──────────────────────────── */}
            {!isInline && (
              <div className="sticky top-0 z-30 flex justify-center pb-1 pt-3 md:hidden">
                <div className="h-1 w-10 rounded-full bg-slate-300" />
              </div>
            )}

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
              AI CONSULT — Dedicated card
          ════════════════════════════════════════════════════════════════ */}
          {!isKotodute && (
            <div
              className="rounded-2xl border px-4 py-4 shadow-sm"
              style={{ backgroundColor: theme.light, borderColor: theme.border }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: theme.accent }}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: theme.text }}>ショップ相談</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    このお店のおすすめ、旬、買い方のコツを会話しながら深掘りできます
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {shop.products.slice(0, 3).map((product) => (
                  <span
                    key={product}
                    className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {product}
                  </span>
                ))}
              </div>
                <button
                  type="button"
                  onClick={handleOpenAiPanel}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                  style={{ color: theme.text }}
                >
                ショップ相談を開く
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
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
          <div className="h-full w-1/3 overflow-y-auto">
            <KotodutePanel
              shop={shop}
              theme={theme}
              onBack={handleBackToMain}
            />
          </div>
          {/* ── AI consult panel ───────────────────────────────────────── */}
          <div className="h-full w-1/3 overflow-hidden">
            <AiConsultPanel
              shop={shop}
              theme={theme}
              onBack={handleBackToMain}
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
  theme,
  onBack,
}: {
  shop: Shop;
  theme: { bg: string; accent: string; text: string; border: string; light: string };
  onBack: () => void;
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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 border-b bg-white/95 px-3 py-3 backdrop-blur-sm"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          戻る
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <span className="text-sm font-bold text-slate-900">ことづて</span>
          {notes.length > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: theme.light, color: theme.text }}
            >
              {notes.length}
            </span>
          )}
        </div>
        <div className="w-14" /> {/* balance spacer */}
      </div>

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

// ─── AI Consult Panel (3rd slide) ─────────────────────────────────────────────
type AiChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  speakerId?: string;
  speakerName?: string;
};

const CHAR_EMOJI: Record<string, string> = {
  nichiyosan: "🧓",
  yoichisan:  "👴",
  miraikun:   "🌟",
  yosakochan: "🌸",
};


function AiConsultPanel({
  shop,
  theme,
  onBack,
}: {
  shop: Shop;
  theme: { bg: string; accent: string; text: string; border: string; light: string };
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; text: string }[]>([]);
  const streamingIdRef = useRef<string | null>(null);

  const shopContext = useMemo(() => ({
    category: shop.category,
    catchphrase: shop.catchphrase,
    shopStrength: shop.shopStrength,
    products: shop.products,
    chome: shop.chome,
  }), [shop.category, shop.catchphrase, shop.shopStrength, shop.products, shop.chome]);

  // Reset state when shop changes
  useEffect(() => {
    setMessages([]);
    historyRef.current = [];
    setInput("");
    setLoading(false);
    setHasStarted(false);
    setErrorNotice(null);
    streamingIdRef.current = null;
  }, [shop.id]);

  const suggestedPrompts = useMemo(() => {
    const prompts = [
      "このお店のおすすめを教えて",
      `${shop.name}で今おすすめの買い方は？`,
      "初めて来た人に向いている商品は？",
    ];
    if (shop.products[0]) {
      prompts.push(`${shop.products[0]}はどんな人におすすめ？`);
    }
    if (shop.category === "食材") {
      prompts.push("旬の食材や食べ方のコツはある？");
    }
    return Array.from(new Set(prompts)).slice(0, 4);
  }, [shop.category, shop.name, shop.products]);

  const streamResponse = useCallback(async (text: string, msgId: string) => {
    setLoading(true);
    setErrorNotice(null);
    streamingIdRef.current = msgId;
    // Add empty AI message to stream into
    setMessages((prev) => [...prev, { id: msgId, role: "assistant", text: "" }]);
    try {
      const res = await fetch("/api/grandma/shop-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shop.name,
          shopContext,
          history: historyRef.current,
          text,
        }),
      });
      if (!res.ok || !res.body) throw new Error("stream error");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        const snapshot = accumulated;
        setMessages((prev) =>
          prev.map((m) => m.id === msgId ? { ...m, text: snapshot } : m)
        );
      }
      historyRef.current = [
        ...historyRef.current,
        { role: "user", text },
        { role: "assistant", text: accumulated },
      ];
    } catch {
      setErrorNotice("返答の取得に失敗しました。少し時間をおいて再度お試しください。");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, text: "エラーが発生しました。もう一度お試しください。" } : m
        )
      );
    } finally {
      setLoading(false);
      streamingIdRef.current = null;
    }
  }, [shop.name, shopContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setHasStarted(true);
    setInput("");
    const userMsg: AiChatMsg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    await streamResponse(trimmed, crypto.randomUUID());
  }, [loading, streamResponse]);

  const handleSend = useCallback(async () => {
    await handleAsk(input);
  }, [handleAsk, input]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 border-b bg-white/95 px-3 py-3 backdrop-blur-sm"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          戻る
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" style={{ color: theme.accent }} />
          <span className="text-sm font-bold text-slate-900">ショップ相談</span>
        </div>
        <div className="w-14" />
      </div>

      {/* ── Shop context ────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b px-4 py-3" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.text }}>
          {shop.category || "ショップ相談"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-bold text-slate-900">{shop.name}</span>
          {" "}のおすすめやこだわりを深掘りできます
        </p>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!hasStarted && messages.length === 0 && (
          <div className="space-y-4">
            <div
              className="rounded-3xl border px-4 py-4 shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.bg }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg shadow-sm"
                  style={{ backgroundColor: theme.light, border: `1.5px solid ${theme.border}` }}
                >
                  🧓
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">にちよさんに聞いてみる</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {shop.shopStrength?.trim() || `${shop.name} のおすすめや買い方のコツを、会話しながら案内します。`}
                  </p>
                </div>
              </div>
            </div>

            {shop.products.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  よく出る商品
                </p>
                <div className="flex flex-wrap gap-2">
                  {shop.products.slice(0, 6).map((product) => (
                    <button
                      key={product}
                      type="button"
                      onClick={() => handleAsk(`${product}のおすすめポイントを教えて`)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                まずはここから
              </p>
              <div className="space-y-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAsk(prompt)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-slate-800 px-4 py-2.5 text-sm leading-relaxed text-white">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg shadow-sm"
                style={{ backgroundColor: theme.light, border: `1.5px solid ${theme.border}` }}
              >
                ✨
              </div>
              <div className="max-w-[82%]">
                <div
                  className="rounded-2xl rounded-tl-sm border px-4 py-2.5 text-sm leading-relaxed text-slate-800"
                  style={{ borderColor: theme.border, backgroundColor: theme.bg }}
                >
                  {msg.text || (
                    <span className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="inline-block h-2 w-2 animate-bounce rounded-full"
                          style={{ backgroundColor: theme.accent, animationDelay: `${d}ms` }}
                        />
                      ))}
                    </span>
                  )}
                  {loading && streamingIdRef.current === msg.id && msg.text && (
                    <span
                      className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse align-middle"
                      style={{ backgroundColor: theme.accent }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t bg-white px-3 py-3" style={{ borderColor: theme.border }}>
        {errorNotice && (
          <p className="mb-2 text-xs text-rose-600">{errorNotice}</p>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="質問を入力…"
            disabled={loading}
            className="min-w-0 flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:bg-white focus:outline-none disabled:opacity-50"
            style={{ borderColor: theme.border }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition disabled:opacity-40 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: theme.accent }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
