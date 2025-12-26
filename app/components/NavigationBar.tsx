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

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex h-full flex-1 flex-col items-center justify-center transition-colors ${
                isActive ? "text-amber-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mb-1 text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
