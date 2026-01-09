const CATEGORY_BANNER_MAP: Record<string, string> = {
  "食材": "/images/shops/ninjin.webp",
  "食べ物": "/images/shops/imotenn.webp",
  "道具・工具": "/images/shops/kougu.webp",
  "生活雑貨": "/images/shops/takekago.webp",
  "植物・苗": "/images/shops/uekibachi.webp",
  "アクセサリー": "/images/shops/accessories.webp",
  "手作り・工芸": "/images/shops/handcraft.webp",
};

export function getShopBannerImage(category?: string | null) {
  if (!category) return "/images/shops/tosahamono.webp";
  return CATEGORY_BANNER_MAP[category] ?? "/images/shops/tosahamono.webp";
}
