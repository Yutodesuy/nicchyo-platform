"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBag } from "@/lib/storage/BagContext";
import { getBannerOpens, getAccumulatedMarketTimeMs } from "@/lib/storage/marketStats";

// ─── サイドナビ項目 ────────────────────────────────────────────────────────────
type NavItem = {
  name: string;
  href: string;
  icon: "search" | "chat" | "admin";
};

const baseNavItems: NavItem[] = [
  { name: "相談", href: "/map?panel=consult", icon: "chat" },
  { name: "お店を探す", href: "/map?panel=search", icon: "search" },
];

// ─── メニューシート項目 ────────────────────────────────────────────────────────
type MenuItem = {
  label: string;
  href: string;
  emoji: string;
  color: string;
  textColor: string;
};

const mainMenuItems: MenuItem[] = [
  { label: "バッグ",     href: "/bag",        emoji: "🛍️", color: "bg-amber-50",  textColor: "text-amber-800"  },
  { label: "バッジ",     href: "/badges",     emoji: "🏆", color: "bg-yellow-50", textColor: "text-yellow-800" },
  { label: "ことづて",   href: "/kotodute",   emoji: "💬", color: "bg-green-50",  textColor: "text-green-800"  },
  { label: "レシピ",     href: "/recipes",    emoji: "🍳", color: "bg-orange-50", textColor: "text-orange-800" },
  { label: "nicchyoとは", href: "/about",    emoji: "ℹ️", color: "bg-sky-50",    textColor: "text-sky-800"    },
  { label: "マイページ", href: "/my-profile", emoji: "👤", color: "bg-purple-50", textColor: "text-purple-800" },
];

const vendorMenuItems = [
  { label: "出店者ダッシュボード", href: "/vendor/dashboard",  emoji: "🏪" },
  { label: "商品管理",            href: "/vendor/products",   emoji: "📦" },
  { label: "注文管理",            href: "/vendor/orders",     emoji: "📋" },
];

const adminMenuItems = [
  { label: "管理ダッシュボード", href: "/admin/dashboard",  emoji: "⚙️" },
  { label: "ユーザー管理",       href: "/admin/users",      emoji: "👥" },
  { label: "コンテンツ管理",     href: "/admin/content",    emoji: "📝" },
];

// ─── Props ────────────────────────────────────────────────────────────────────
type NavigationBarProps = {
  activeHref?: string;
  position?: "fixed" | "absolute";
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NavigationBar({
  activeHref,
  position = "fixed",
}: NavigationBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, permissions, logout } = useAuth();
  const { items: bagItems, totalPrice } = useBag();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({ bannerOpens: 0, marketTimeMs: 0 });

  useEffect(() => {
    if (!menuOpen) return;
    setStats({
      bannerOpens: getBannerOpens(),
      marketTimeMs: getAccumulatedMarketTimeMs(),
    });
  }, [menuOpen]);

  const panel = searchParams?.get("panel");
  const isHome = (activeHref ?? pathname) === "/map" && !panel;
  const isPanelOpen = pathname === "/map" && !!panel;

  const navItems = permissions.isSuperAdmin
    ? [...baseNavItems, { name: "管理", href: "/admin/dashboard", icon: "admin" as const }]
    : baseNavItems;

  const handleMenuItemClick = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/map");
  };

  const roleLabel = permissions.isSuperAdmin
    ? { text: "管理者", color: "bg-red-100 text-red-700" }
    : permissions.isModerator
    ? { text: "モデレーター", color: "bg-purple-100 text-purple-700" }
    : permissions.isVendor
    ? { text: "出店者", color: "bg-amber-100 text-amber-700" }
    : null;

  return (
    <>
      {/* ── ボトムメニューシート ────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* 背景オーバーレイ */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9995] bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            {/* シート本体 */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
              className="fixed bottom-0 left-0 right-0 z-[9996] rounded-t-3xl bg-white shadow-2xl"
              style={{ paddingBottom: "calc(var(--safe-bottom, 0px) + 5.5rem)" }}
            >
              {/* ドラッグハンドル */}
              <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-gray-200" />

              {/* スクロール領域 */}
              <div className="max-h-[75dvh] overflow-y-auto overscroll-contain px-5 pb-2 pt-3">

                {/* ─ ユーザーセクション ─ */}
                {isLoggedIn && user ? (
                  <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white ring-2 ring-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{user.name}</p>
                      {user.email && (
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                      )}
                    </div>
                    {roleLabel && (
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${roleLabel.color}`}>
                        {roleLabel.text}
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleMenuItemClick("/login")}
                    className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">ログイン / 登録</p>
                      <p className="text-xs text-gray-400">アカウントでもっと便利に</p>
                    </div>
                    <svg className="ml-auto h-4 w-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* ─ ダッシュボード ─ */}
                <MarketDashboard
                  bannerOpens={stats.bannerOpens}
                  marketTimeMs={stats.marketTimeMs}
                  totalPrice={totalPrice}
                  bagItemCount={bagItems.length}
                />

                {/* ─ メインメニュー グリッド ─ */}
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">メニュー</p>
                <div className="mb-5 grid grid-cols-3 gap-2.5">
                  {mainMenuItems.map((item, i) => (
                    <motion.button
                      key={item.href}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: "spring", damping: 20, stiffness: 300 }}
                      onClick={() => handleMenuItemClick(item.href)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl ${item.color} px-2 py-3.5 transition active:scale-95`}
                    >
                      <span className="text-2xl leading-none">{item.emoji}</span>
                      <span className={`text-[11px] font-semibold leading-tight ${item.textColor}`}>{item.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* ─ 出店者メニュー ─ */}
                {(permissions.isVendor || permissions.isSuperAdmin) && (
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber-500">出店者</p>
                    <div className="overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/50">
                      {vendorMenuItems.map((item, i) => (
                        <button
                          key={item.href}
                          onClick={() => handleMenuItemClick(item.href)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-amber-50 active:scale-[0.99] ${i !== 0 ? "border-t border-amber-100" : ""}`}
                        >
                          <span className="text-base">{item.emoji}</span>
                          <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                          <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─ 管理メニュー ─ */}
                {permissions.isSuperAdmin && (
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-red-400">管理者</p>
                    <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50/50">
                      {adminMenuItems.map((item, i) => (
                        <button
                          key={item.href}
                          onClick={() => handleMenuItemClick(item.href)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-red-50 active:scale-[0.99] ${i !== 0 ? "border-t border-red-100" : ""}`}
                        >
                          <span className="text-base">{item.emoji}</span>
                          <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                          <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─ ログアウト ─ */}
                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    ログアウト
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ナビゲーションバー ──────────────────────────────────────────────── */}
      <nav
        onClick={isPanelOpen ? () => router.push("/map") : undefined}
        className={`navigation-bar ${position} bottom-0 left-0 right-0 z-[9997] border-t text-sm leading-none shadow-sm transition-colors duration-300 ${
          isPanelOpen
            ? "cursor-pointer border-green-500 bg-green-500"
            : "border-gray-200/60 bg-white/90 backdrop-blur-md"
        }`}
        style={{ paddingBottom: "var(--safe-bottom, 0px)" }}
      >
        {isHome ? (
          /* ── マップ：フルナビ ── */
          <div className="mx-auto flex h-14 max-w-lg items-center">
            {/* 左：相談 */}
            <NavLinkItem
              item={navItems[0]}
              isActive={(activeHref ?? pathname) === navItems[0].href}
            />

            {/* 中央：メニューボタン */}
            <div className="flex flex-1 items-center justify-center">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex flex-col items-center gap-1 transition-all duration-200 active:scale-95"
              >
                <motion.div
                  animate={menuOpen ? { rotate: 45, scale: 1.1 } : { rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-md"
                >
                  <MenuGridIcon className="h-5 w-5" />
                </motion.div>
                <span className="text-[10px] font-medium leading-none tracking-tight text-gray-500">
                  メニュー
                </span>
              </button>
            </div>

            {/* 右：お店を探す（+ 管理タブがあれば追加） */}
            {navItems.slice(1).map((item) => (
              <NavLinkItem
                key={item.href}
                item={item}
                isActive={(activeHref ?? pathname) === item.href}
              />
            ))}
          </div>
        ) : isPanelOpen ? (
          /* ── パネル表示中：緑バー × ── */
          <div className="mx-auto flex h-14 max-w-lg items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-[10px] font-medium leading-none tracking-tight text-white/80">
                閉じる
              </span>
            </div>
          </div>
        ) : (
          /* ── サブページ：もどるバー ── */
          <div className="mx-auto flex h-14 max-w-lg items-center px-4">
            <button
              onClick={() => router.push("/map")}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-gray-600 transition active:scale-95 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              マップにもどる
            </button>
          </div>
        )}
      </nav>
    </>
  );
}

// ─── NavLinkItem ──────────────────────────────────────────────────────────────
function NavLinkItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      className={`group flex h-full flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 ${
        isActive
          ? "text-amber-600"
          : "text-gray-400 hover:bg-gray-50/50 hover:text-gray-600"
      }`}
    >
      <NavIcon
        name={item.icon}
        className={`h-6 w-6 transition-transform duration-200 ${
          isActive ? "scale-105" : "group-hover:scale-105"
        }`}
      />
      <span className="text-[10px] font-medium leading-none tracking-tight">
        {item.name}
      </span>
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function MenuGridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <rect x="3"  y="3"  width="7" height="7" rx="1.5" />
      <rect x="14" y="3"  width="7" height="7" rx="1.5" />
      <rect x="3"  y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

type NavIconProps = { name: NavItem["icon"]; className?: string };

function NavIcon({ name, className }: NavIconProps) {
  const props = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="6.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5 20 20" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v6A2.25 2.25 0 0 1 17.25 15H9l-3.75 3v-3H6.75A2.25 2.25 0 0 1 4.5 12.75v-6Z"
          />
        </svg>
      );
    case "admin":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── MarketDashboard ──────────────────────────────────────────────────────────
function formatMarketTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return "0分";
  if (totalMinutes < 60) return `${totalMinutes}分`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
}

type MarketDashboardProps = {
  bannerOpens: number;
  marketTimeMs: number;
  totalPrice: number;
  bagItemCount: number;
};

function MarketDashboard({ bannerOpens, marketTimeMs, totalPrice, bagItemCount }: MarketDashboardProps) {
  const stats = [
    {
      emoji: "🏪",
      label: "お店を見た",
      value: `${bannerOpens}回`,
      color: "from-amber-400 to-orange-400",
    },
    {
      emoji: "🛍️",
      label: totalPrice > 0 ? "購入合計" : "バッグ",
      value: totalPrice > 0 ? `¥${totalPrice.toLocaleString()}` : `${bagItemCount}品`,
      color: "from-green-400 to-emerald-500",
    },
    {
      emoji: "⏱️",
      label: "市場滞在",
      value: formatMarketTime(marketTimeMs),
      color: "from-sky-400 to-blue-500",
    },
  ];

  return (
    <div className="mb-5">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">今日の日曜市</p>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 rounded-2xl bg-gray-50 p-3 text-center"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${stat.color} text-lg shadow-sm`}>
              {stat.emoji}
            </div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{stat.value}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
