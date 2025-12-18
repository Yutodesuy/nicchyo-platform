export const FAVORITE_SHOPS_KEY = "nicchyo-favorite-shops";

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  return Array.from(new Set(ids));
}

export function loadFavoriteShopIds(): number[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FAVORITE_SHOPS_KEY);
  if (!raw) return [];
  try {
    return normalizeIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveFavoriteShopIds(ids: number[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeIds(ids);
  localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify(normalized));
}

export function toggleFavoriteShopId(id: number): number[] {
  const current = loadFavoriteShopIds();
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  const values = Array.from(next);
  saveFavoriteShopIds(values);
  return values;
}
