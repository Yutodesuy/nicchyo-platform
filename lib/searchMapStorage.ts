export type SearchMapPayload = {
  ids: number[];
  label: string;
};

export const SEARCH_MAP_STORAGE_KEY = "nicchyo-search-map-results";

export function saveSearchMapPayload(payload: SearchMapPayload) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEARCH_MAP_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

export function loadSearchMapPayload(): SearchMapPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SEARCH_MAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SearchMapPayload;
    if (!Array.isArray(parsed?.ids) || typeof parsed?.label !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
