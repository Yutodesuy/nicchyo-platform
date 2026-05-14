const CONSULT_VISITOR_KEY_STORAGE_KEY = "nicchyo-consult-visitor-key";

function generateFallbackVisitorKey() {
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateConsultVisitorKey() {
  if (typeof window === "undefined") return null;

  const existing = window.localStorage.getItem(CONSULT_VISITOR_KEY_STORAGE_KEY)?.trim();
  if (existing) {
    return existing;
  }

  const nextKey =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : generateFallbackVisitorKey();

  window.localStorage.setItem(CONSULT_VISITOR_KEY_STORAGE_KEY, nextKey);
  return nextKey;
}

