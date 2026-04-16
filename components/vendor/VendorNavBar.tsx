"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Megaphone, Store, BarChart2, Settings } from "lucide-react";

const TABS = [
  { href: "/my-shop",          label: "ホーム", icon: Home },
  { href: "/vendor/posts",     label: "投稿履歴", icon: Megaphone },
  { href: "/vendor/store",     label: "店舗情報", icon: Store },
  { href: "/vendor/analytics", label: "分析",   icon: BarChart2 },
  { href: "/vendor/account",   label: "設定",   icon: Settings },
];

export default function VendorNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-amber-100 bg-white/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/my-shop"
              ? pathname === "/my-shop"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition active:scale-95 ${
                isActive ? "text-amber-600" : "text-slate-400"
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.7 : 1.9}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
