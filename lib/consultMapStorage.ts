export type ConsultMapPayload = {
  ids: number[];
  label: string;
};

export const CONSULT_MAP_STORAGE_KEY = "nicchyo-consult-map-results";

export function saveConsultMapPayload(payload: ConsultMapPayload) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSULT_MAP_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

export function loadConsultMapPayload(): ConsultMapPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSULT_MAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsultMapPayload;
    if (!Array.isArray(parsed?.ids) || typeof parsed?.label !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
