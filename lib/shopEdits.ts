import type { Shop, ShopEditableData } from "@/app/(public)/map/types/shopData";

export const SHOP_EDITS_STORAGE_KEY = "nicchyo-shop-edits";
export const SHOP_EDITS_UPDATED_EVENT = "nicchyo-shop-edits-updated";

type ShopEditsMap = Record<string, Partial<ShopEditableData>>;

function readEditsMap(): ShopEditsMap {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(SHOP_EDITS_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as ShopEditsMap;
    }
  } catch {
    // ignore parse errors
  }
  return {};
}

function writeEditsMap(map: ShopEditsMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify(map));
}

export function loadShopEdits(shopId: number): Partial<ShopEditableData> {
  const map = readEditsMap();
  return map[String(shopId)] ?? {};
}

export function saveShopEdits(shopId: number, edits: Partial<ShopEditableData>) {
  const map = readEditsMap();
  map[String(shopId)] = edits;
  writeEditsMap(map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SHOP_EDITS_UPDATED_EVENT, { detail: { shopId } })
    );
  }
}

export function applyShopEdits(shops: Shop[]): Shop[] {
  const map = readEditsMap();
  return shops.map((shop) => {
    const edits = map[String(shop.id)];
    if (!edits) return shop;
    return {
      ...shop,
      ...edits,
      images: edits.images ? { ...shop.images, ...edits.images } : shop.images,
      socialLinks: edits.socialLinks
        ? { ...shop.socialLinks, ...edits.socialLinks }
        : shop.socialLinks,
    };
  });
}
