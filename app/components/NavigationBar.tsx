"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMapLoading } from "./MapLoadingProvider";

type NavItem = {
  name: string;
  href: string;
  icon: "map" | "search" | "recipe" | "chat";
};

const navItems: NavItem[] = [
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
    default:
      return null;
  }
}
