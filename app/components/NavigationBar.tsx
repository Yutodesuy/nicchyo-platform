"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMapLoading } from "./MapLoadingProvider";
import { useAuth } from "@/lib/auth/AuthContext";

type NavItem = {
  name: string;
  href: string;
  icon: "map" | "search" | "recipe" | "chat" | "admin";
};

const baseNavItems: NavItem[] = [
  { name: "マップ", href: "/map", icon: "map" },
  { name: "検索", href: "/search", icon: "search" },
  { name: "レシピ", href: "/recipes", icon: "recipe" },
  { name: "ことづて", href: "/kotodute", icon: "chat" },
];

type NavigationBarProps = {
  activeHref?: string;
};

export default function NavigationBar({ activeHref }: NavigationBarProps) {
  const pathname = usePathname();
  const { startMapLoading } = useMapLoading();
  const { permissions } = useAuth();

  // 管理者の場合は管理者ダッシュボードを追加
  const navItems = permissions.isSuperAdmin
    ? [...baseNavItems, { name: "管理", href: "/admin", icon: "admin" as const }]
    : baseNavItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9997] border-t border-gray-200/50 bg-white/80 backdrop-blur-md shadow-lg"
      style={{ paddingBottom: "var(--safe-bottom, 0px)" }}
    >
      <div className="mx-auto flex h-12 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = (activeHref ?? pathname) === item.href;
          const handleClick = item.href === "/map" ? startMapLoading : undefined;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleClick}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-amber-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type NavIconProps = {
  name: NavItem["icon"];
  className?: string;
};

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
    case "map":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75 5.25 5.25 3 6.75v11.5l3.75-1.5 6 2.25 5.25-2.25V5.25L12.75 7.5 9 6.75Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75v11.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 7.5v11.25" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="6.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5 20 20" />
        </svg>
      );
    case "recipe":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 5.25h10.5A1.5 1.5 0 0 1 18.75 6.75v11.5A1.5 1.5 0 0 1 17.25 19.75H6.75A1.5 1.5 0 0 1 5.25 18.25V6.75A1.5 1.5 0 0 1 6.75 5.25Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9h7.5M8.25 12h7.5M8.25 15h4.5" />
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      );
    default:
      return null;
  }
}
