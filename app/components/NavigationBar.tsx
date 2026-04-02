"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthContext";

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
};

const baseMenuItems: MenuItem[] = [
  { label: "バッグ",       href: "/bag",      emoji: "🛍️", color: "bg-amber-50"  },
  { label: "バッジ",       href: "/badges",   emoji: "🏆", color: "bg-yellow-50" },
  { label: "ことづて",     href: "/kotodute", emoji: "💬", color: "bg-green-50"  },
  { label: "レシピ",       href: "/recipes",  emoji: "🍳", color: "bg-orange-50" },
  { label: "nicchyoとは", href: "/about",    emoji: "ℹ️", color: "bg-sky-50"    },
  { label: "マイページ",   href: "/my-profile", emoji: "👤", color: "bg-purple-50" },
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
  const { permissions } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[9996] rounded-t-3xl bg-white px-5 pb-[calc(var(--safe-bottom,0px)+5.5rem)] pt-5 shadow-2xl"
            >
              {/* ドラッグハンドル */}
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

              {/* タイトル */}
              <p className="mb-4 text-center text-xs font-bold tracking-widest text-gray-400 uppercase">
                メニュー
              </p>

              {/* グリッド */}
              <div className="grid grid-cols-3 gap-3">
                {baseMenuItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleMenuItemClick(item.href)}
                    className={`flex flex-col items-center gap-2 rounded-2xl ${item.color} p-4 transition active:scale-95`}
                  >
                    <span className="text-3xl leading-none">{item.emoji}</span>
                    <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                  </button>
                ))}
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
