// app/(public)/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shop } from "../data/shops";
import { useAuth } from "../../../../lib/auth/AuthContext";
import { getShopBannerImage } from "../../../../lib/shopImages";
import { useBag } from "../../../../lib/storage/BagContext";
import { ingredientCatalog, recipes } from "../../../../lib/recipes";
import {
  KOTODUTE_UPDATED_EVENT,
  loadKotodute,
  type KotoduteNote,
} from "../../../../lib/kotoduteStorage";
import { Plus, Check, ShoppingBag, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ShopDetailBannerProps = {
  shop: Shop;
  bagCount?: number;
  onClose?: () => void;
  onAddToBag?: (name: string, fromShopId?: number) => void;
  variant?: "default" | "kotodute";
  inMarket?: boolean;
  attendanceEstimate?: {
    label: string;
    p: number | null;
    n_eff: number;
    vendor_override: boolean;
    evidence_summary: string;
  };
  originRect?: { x: number; y: number; width: number; height: number };
};

const KOTODUTE_PREVIEW_LIMIT = 3;
const KOTODUTE_TAG_REGEX = /\s*#\d+|\s*#all/gi;
const OSEKKAI_FALLBACK =
  "あら、ここのお店、最近行ってないねぇ。今日は何が出ちゅうか、ちょっと見てきてくれん？";

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

export default function ShopDetailBanner({
  shop,
  bagCount,
  onClose,
  onAddToBag,
  variant = "default",
  inMarket,
  attendanceEstimate,
  originRect,
}: ShopDetailBannerProps) {
  const router = useRouter();
  const { permissions } = useAuth();
  const { addItem, isInBag, removeItem, items: bagItems } = useBag();
  const [kotoduteNotes, setKotoduteNotes] = useState<KotoduteNote[]>([]);
  const [kotoduteFilter, setKotoduteFilter] = useState<"presence" | "footprints" | null>(null);
  const [shopOpenStatus, setShopOpenStatus] = useState<"open" | "closed" | null>(null);

  // Guide State
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("shop-banner-open");
    return () => {
      document.body.classList.remove("shop-banner-open");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeenGuide = localStorage.getItem("nicchyo-shop-banner-guide-seen");
    if (!hasSeenGuide) {
      // Delay slightly to allow animation to settle
      const timer = setTimeout(() => setShowGuide(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem("nicchyo-shop-banner-guide-seen", "true");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateKotodute = () => {
      const notes = loadKotodute().filter(
        (note) => typeof note.shopId === "number" && note.shopId === shop.id
      );
      const sorted = notes.slice().sort((a, b) => b.createdAt - a.createdAt);
      setKotoduteNotes(sorted);
    };
    updateKotodute();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "nicchyo-kotodute-notes") {
        updateKotodute();
      }
    };
    const handleUpdate = () => updateKotodute();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(KOTODUTE_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(KOTODUTE_UPDATED_EVENT, handleUpdate);
    };
  }, [shop.id]);

  const handleProductToggle = useCallback(
    (product: string) => {
      const inBag = isInBag(product, shop.id);

      if (inBag) {
        // Find item ID to remove
        const item = bagItems.find(
          i => i.name === product && i.fromShopId === shop.id
        );
        if (item) {
          removeItem(item.id);
        }
      } else {
        if (onAddToBag) {
          onAddToBag(product, shop.id);
        } else {
          addItem({ name: product, fromShopId: shop.id });
        }
      }
    },
    [addItem, isInBag, onAddToBag, removeItem, bagItems, shop.id]
  );

  const handleBagClick = useCallback(() => {
    router.push("/bag");
  }, [router]);

  const isKotodute = variant === "kotodute";
  const today = new Date();
  const matchedIngredientIds = useMemo(() => {
    if (shop.category !== "食材") return [];
    return shop.products
      .map((product) => findIngredientMatch(product)?.id)
      .filter(Boolean) as string[];
  }, [shop.category, shop.products]);
  const suggestedRecipes = useMemo(() => {
    if (matchedIngredientIds.length === 0) return [];
    const ids = new Set(matchedIngredientIds);
    return recipes
      .filter((recipe) => recipe.ingredientIds.some((id) => ids.has(id)))
      .slice(0, 2);
  }, [matchedIngredientIds]);
  const shopStatusSignals = useMemo(() => {
    const seed = typeof shop.id === "number" ? shop.id : Number(String(shop.id).replace(/\D/g, "")) || 0;
    const total = (seed * 7) % 20;
    const ratioSeed = ((seed % 7) + 2) / 10;
    const openVotes = total === 0 ? 0 : Math.round(total * ratioSeed);
    const closedVotes = Math.max(total - openVotes, 0);
    const vendorPick = seed % 13 === 0 ? "open" : seed % 17 === 0 ? "closed" : null;
    return { total, openVotes, closedVotes, vendorPick };
  }, [shop.id]);
  const shopStatusLabel = useMemo(() => {
    if (attendanceEstimate?.label) return attendanceEstimate.label;
    if (shopStatusSignals.vendorPick === "open") return "出店している";
    if (shopStatusSignals.vendorPick === "closed") return "出店していない";
    const priorYes = 5;
    const priorNo = 5;
    const nEff = shopStatusSignals.total;
    if (nEff < 3) return "わからない";
    const yes = priorYes + shopStatusSignals.openVotes;
    const no = priorNo + shopStatusSignals.closedVotes;
    const p = yes / (yes + no);
    if (p >= 0.85) return "出店している可能性が高い";
    if (p >= 0.7) return "おそらく出店している";
    if (p > 0.2 && p < 0.5) return "出店していないかもしれない";
    if (p <= 0.2) return "出店していない可能性が高い";
    return "おそらく出店している";
  }, [shopStatusSignals, attendanceEstimate]);
  const shopStatusDisplay = useMemo(() => {
    if (shopStatusLabel === "出店している" || shopStatusLabel === "出店していない") {
      return shopStatusLabel;
    }
    const rangeMap: Record<string, string> = {
      "出店している可能性が高い": "85〜100%",
      "おそらく出店している": "70〜85%",
      "出店していないかもしれない": "20〜50%",
      "出店していない可能性が高い": "0〜20%",
      "わからない": "50%",
    };
    const range = rangeMap[shopStatusLabel] ?? "50%";
    return `${shopStatusLabel}（${range}）`;
  }, [shopStatusLabel]);
  const statusBoxTone = useMemo(() => {
    if (!attendanceEstimate?.vendor_override) return "neutral";
    if (shopStatusLabel === "出店している") return "open";
    if (shopStatusLabel === "出店していない") return "closed";
    return "neutral";
  }, [attendanceEstimate, shopStatusLabel]);
  const askTopics = useMemo(() => {
    if (Array.isArray(shop.topic) && shop.topic.length > 0) {
      return shop.topic.filter((item) => item && item.trim()).slice(0, 6);
    }
    const raw = (shop.message || shop.aboutVendor || shop.description || "").trim();
    if (raw) {
      const parsed = raw
        .split(/[\n、,・]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5);
      if (parsed.length > 0) return parsed;
    }
    return ["おすすめの食べ方", "旬の話題", "市場のこと", "出店のこだわり"];
  }, [shop.aboutVendor, shop.description, shop.message, shop.topic]);
  const shopNameSizeClass = useMemo(() => {
    const length = shop.name?.length ?? 0;
    if (length >= 18) return "text-2xl";
    if (length >= 14) return "text-3xl";
    return "text-4xl";
  }, [shop.name]);
  const kotodutePresenceNotes = useMemo(
    () =>
      kotoduteNotes.filter((note) => {
        const d = new Date(note.createdAt);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      }),
    [kotoduteNotes, today]
  );
  const kotoduteFootprintNotes = useMemo(
    () =>
      kotoduteNotes.filter((note) => {
        const d = new Date(note.createdAt);
        return (
          d.getFullYear() !== today.getFullYear() ||
          d.getMonth() !== today.getMonth() ||
          d.getDate() !== today.getDate()
        );
      }),
    [kotoduteNotes, today]
  );
  const handleKotoduteToggle = useCallback(
    (next: "presence" | "footprints") => {
      setKotoduteFilter((prev) => (prev === next ? null : next));
    },
    []
  );
  const handleShopStatusSubmit = useCallback(() => {
    if (!shopOpenStatus) return;
  }, [shopOpenStatus]);


  const canEditShop = permissions.canEditShop(shop.id);
  const bannerSeed = (shop.position ?? shop.id) * 2 + (shop.side === "south" ? 1 : 0);
  const bannerImage = shop.images?.main ?? getShopBannerImage(shop.category, bannerSeed);

  const handleEditShop = useCallback(() => {
    router.push("/my-shop");
  }, [router]);

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

  return (
    <div className="fixed inset-0 z-[2000] flex items-stretch justify-center bg-slate-900/30">
      <div
        className={`h-full w-full max-w-none overflow-y-auto bg-white px-6 pb-24 pt-6 shadow-2xl ${
          originRect ? "shop-banner-animate" : ""
        }`}
        style={bannerStyle}
      >
        {/* Guide Overlay */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col bg-slate-900/80 p-6 text-white"
              onClick={handleCloseGuide}
            >
              <div className="mt-auto mb-32 space-y-8 max-w-lg mx-auto w-full relative">
                {/* Product Tip */}
                <div className="relative">
                  <div className="absolute -top-12 -left-4 text-4xl">👆</div>
                  <h3 className="text-xl font-bold text-amber-300 mb-1">商品をタップ！</h3>
                  <p className="text-sm leading-relaxed">
                    気になる商品をタップすると、「買い物リスト」に追加されます。<br/>
                    買う予定のものをメモしておきましょう。
                  </p>
                </div>

                {/* Osekkai Tip */}
                <div className="relative pt-4 border-t border-white/20">
                  <h3 className="text-xl font-bold text-amber-300 mb-1">お店の情報をチェック</h3>
                  <p className="text-sm leading-relaxed">
                    お店の特徴や、おばあちゃんからの一言（おせっかい）が見られます。
                  </p>
                </div>

                <button
                  className="mt-8 w-full rounded-full bg-white py-3 text-slate-900 font-bold shadow-lg active:scale-95 transition-transform"
                >
                  わかった！
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 写真 */}
        <div className="-mx-6 -mt-6 overflow-hidden border-y border-slate-200 bg-white relative">
          <Image
            src={bannerImage}
            alt={`${shop.name}の写真`}
            width={960}
            height={640}
            className="h-56 w-full object-cover object-center md:h-72"
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          {!isKotodute && inMarket === true && !attendanceEstimate?.vendor_override && (
            <div className="absolute bottom-4 right-4 rounded-2xl border-2 border-amber-200 bg-amber-50/90 px-4 py-3 shadow-lg">
              <p className="text-base font-semibold text-amber-800">今日はお店を</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShopOpenStatus("open")}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    shopOpenStatus === "open"
                      ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                      : "border-amber-200 bg-white text-amber-800"
                  }`}
                >
                  出店している
                </button>
                <button
                  type="button"
                  onClick={() => setShopOpenStatus("closed")}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    shopOpenStatus === "closed"
                      ? "border-slate-500 bg-slate-200 text-slate-900"
                      : "border-amber-200 bg-white text-amber-800"
                  }`}
                >
                  出店していない
                </button>
                <button
                  type="button"
                  onClick={handleShopStatusSubmit}
                  disabled={!shopOpenStatus}
                  className="rounded-full bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white transition enabled:hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                >
                  送信
                </button>
              </div>
            </div>
          )}
          {!isKotodute && (inMarket !== true || attendanceEstimate?.vendor_override) && (
            <div
              className={`absolute bottom-4 right-4 rounded-2xl border-2 px-4 py-3 shadow-lg ${
                statusBoxTone === "open"
                  ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                  : statusBoxTone === "closed"
                  ? "border-red-400 bg-red-100 text-red-900"
                  : "border-slate-200 bg-white/90 text-slate-900"
              }`}
            >
              <p className="text-base font-semibold">今日はお店を</p>
              <p className="mt-2 text-lg font-semibold">{shopStatusDisplay}</p>
            </div>
          )}
        </div>

        {/* ヘッダー */}
        <div className="mt-6 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`font-semibold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis ${shopNameSizeClass}`}>
                {shop.name}
              </h2>
              {!isKotodute && canEditShop && (
                <button
                  type="button"
                  onClick={handleEditShop}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xl font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  編集する
                </button>
              )}
            </div>
            {!isKotodute && (
              <p className="text-xl text-slate-600">
                {shop.chome ?? "丁目未設定"} | {shop.ownerName}
              </p>
            )}
          </div>
          <div className="fixed right-6 top-6 z-[2105] flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-700 text-3xl font-bold shadow transition-transform hover:scale-110"
              type="button"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        {!isKotodute && (
          <div className="mt-6 divide-y divide-slate-200">
            <section className="py-8 text-xl text-slate-700">
              <p className="text-base font-semibold text-slate-500">主な商品</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{shop.category}</p>
              <p className="mt-4 text-base font-semibold text-slate-500">にちよのおせっかい</p>
              <div className="mt-3 flex items-start gap-4">
                <div className="shrink-0">
                  <Image
                    src="/images/obaasan_transparent.png"
                    alt="おせっかいばあちゃん"
                    width={88}
                    height={88}
                    className="h-20 w-20 opacity-70"
                  />
                </div>
                <div className="relative w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xl leading-relaxed text-slate-700">
                  <span
                    className="absolute -left-2 top-6 h-4 w-4 rotate-45 border-b border-l border-amber-200 bg-amber-50"
                    aria-hidden
                  />
                  {shop.shopStrength?.trim() || OSEKKAI_FALLBACK}
                </div>
              </div>
            </section>

          {/* 商品名 */}
          <section className="py-10 text-xl text-slate-700">
            <div className="mb-6 flex items-center justify-between gap-3">
              <span className="text-base font-semibold text-slate-500">
                商品名
              </span>
              <button
                type="button"
                onClick={handleBagClick}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xl font-semibold shadow-sm transition hover:bg-slate-50 text-slate-700"
                aria-label="買い物リストへ"
              >
                <ShoppingBag size={20} />
                バッグを見る
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {shop.products.map((product) => {
                const inBag = isInBag(product, shop.id);
                return (
                  <button
                    key={product}
                    type="button"
                    onClick={() => handleProductToggle(product)}
                    className={`
                      relative group flex items-center gap-2 rounded-xl px-4 py-3 text-lg font-bold shadow-sm transition-all active:scale-95 border
                      ${inBag
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200"
                        : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                      }
                    `}
                    aria-label={`${product}${inBag ? 'をリストから外す' : 'をリストに追加'}`}
                    aria-pressed={inBag}
                  >
                    {inBag ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                    {product}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-slate-400 flex items-center gap-1">
              <Info size={14} />
              タップして買い物リストに追加
            </p>

            {!isKotodute && shop.category === "食材" && suggestedRecipes.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="text-base font-semibold text-slate-500">この食材で作れるレシピ</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {suggestedRecipes.map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/recipes/${recipe.id}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-lg text-slate-800 shadow-sm transition hover:bg-slate-50"
                    >
                      {recipe.heroImage && (
                        <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <Image
                            src={recipe.heroImage}
                            alt={`${recipe.title}の写真`}
                            width={640}
                            height={360}
                            className="h-32 w-full object-cover"
                          />
                        </div>
                      )}
                      <p className="font-semibold text-slate-900">{recipe.title}</p>
                      <p className="mt-1 text-base text-slate-600">{recipe.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="py-10 text-slate-800">
            <div className="space-y-10 text-2xl">
              <div className="border-t border-slate-200 pt-8 first:border-t-0 first:pt-0">
                <p className="text-base font-semibold text-slate-500">出店スタイル</p>
                <p className="mt-2 text-2xl text-slate-700">
                  {shop.stallStyle ?? shop.schedule}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-8 first:border-t-0 first:pt-0">
                <p className="text-base font-semibold text-slate-500">出店者の想い・こだわり</p>
                <p className="mt-2 text-2xl leading-snug text-slate-800">
                  {shop.aboutVendor || shop.message || shop.description}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-8 first:border-t-0 first:pt-0">
                <p className="text-base font-semibold text-slate-500">得意料理</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {shop.specialtyDish ?? "なし"}
                </p>
              </div>
            </div>
          </section>

          {/* ことづてセクション */}
            <section className="py-10 text-lg text-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-slate-500">
                    ことづて
                  </span>
                  <span className="text-base text-slate-600">
                    {kotoduteNotes.length}
                  </span>
                </div>
                <Link
                  href={`/kotodute?shopId=${shop.id}`}
                  className="rounded-full border border-slate-300 px-3 py-1 text-base font-semibold text-slate-600"
                >
                  投稿・もっと読む
                </Link>
              </div>

              {kotoduteNotes.length === 0 ? (
                <div className="mt-6 border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-base text-slate-600">
                  ことづてページで、お店の感想を共有できます。
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {kotoduteNotes.slice(0, KOTODUTE_PREVIEW_LIMIT).map((note) => (
                    <div
                      key={note.id}
                      className="border border-slate-200 bg-slate-50 px-3 py-3 text-lg text-slate-800"
                    >
                      {note.text.replace(KOTODUTE_TAG_REGEX, "").trim()}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {isKotodute && (
          <div className="mt-10">
            <section className="py-10 text-lg text-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-slate-500">
                    ことづて
                  </span>
                  <span className="text-base text-slate-600">
                    {kotoduteNotes.length}
                  </span>
                </div>
                <Link
                  href={`/kotodute?shopId=${shop.id}`}
                  className="rounded-full border border-slate-300 px-3 py-1 text-base font-semibold text-slate-600"
                >
                  投稿・もっと読む
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleKotoduteToggle("presence")}
                  className={`min-h-[88px] rounded-2xl px-4 py-5 text-left text-xl font-semibold transition ${
                    kotoduteFilter === "presence"
                      ? "bg-pink-200 text-pink-900"
                      : "bg-pink-50 text-pink-700"
                  }`}
                >
                  気配
                </button>
                <button
                  type="button"
                  onClick={() => handleKotoduteToggle("footprints")}
                  className={`min-h-[88px] rounded-2xl px-4 py-5 text-left text-xl font-semibold transition ${
                    kotoduteFilter === "footprints"
                      ? "bg-sky-200 text-sky-900"
                      : "bg-sky-50 text-sky-700"
                  }`}
                >
                  足跡
                </button>
              </div>

              {kotoduteFilter && (
                <div className="mt-8 space-y-4">
                  {(kotoduteFilter === "presence"
                    ? kotodutePresenceNotes
                    : kotoduteFootprintNotes
                  )
                    .slice(0, KOTODUTE_PREVIEW_LIMIT)
                    .map((note) => (
                      <div
                        key={note.id}
                        className="border border-slate-200 bg-white px-3 py-3 text-lg text-slate-800"
                      >
                        {note.text.replace(KOTODUTE_TAG_REGEX, "").trim()}
                      </div>
                    ))}
                  {kotoduteFilter === "presence" && kotodutePresenceNotes.length === 0 && (
                    <div className="border border-dashed border-pink-200 bg-pink-50 px-3 py-4 text-base text-pink-700">
                      今日はまだ気配がありません。
                    </div>
                  )}
                  {kotoduteFilter === "footprints" && kotoduteFootprintNotes.length === 0 && (
                    <div className="border border-dashed border-sky-200 bg-sky-50 px-3 py-4 text-base text-sky-700">
                      まだ足跡がありません。
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 border-t border-slate-200 pt-8">
                <p className="text-base font-semibold text-slate-500">聞いてほしいこと</p>
                <ul className="mt-4 space-y-3 text-lg text-slate-800">
                  {askTopics.map((topic) => (
                    <li key={topic} className="border border-slate-200 bg-white px-3 py-3">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
