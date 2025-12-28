"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "マップ", href: "/map", icon: "🗺️" },
  { name: "検索", href: "/search", icon: "🔍" },
  { name: "レシピ", href: "/recipes", icon: "🍳" },
  { name: "ことづて", href: "/kotodute", icon: "✉️" },
];

/**
 * ボトムナビゲーションバー（最適化版）
 *
 * 【モバイル最適化】
 * - 半透明背景（backdrop-blur）で地図が透けて見える
 * - safe-area-inset-bottom 対応（iOS切り欠き・ジェスチャーバー）
 * - 高さ最小化（h-14 → コンパクト）
 * - オーバーレイ構造（地図を圧迫しない）
 *
 * 【アクセシビリティ】
 * - タップエリア十分確保
 * - アクティブ状態の視覚的フィードバック
 */
export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9997] border-t border-gray-200/50 bg-white/80 backdrop-blur-md shadow-lg"
      style={{
        paddingBottom: 'var(--safe-bottom, 0px)', // iOS ホームインジケーター対応
      }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-amber-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
