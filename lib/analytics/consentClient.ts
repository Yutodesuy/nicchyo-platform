const ANALYTICS_CONSENT_KEY = "nicchyo_analytics_consent";
const LOCATION_CONSENT_KEY = "nicchyo_location_consent";
const CONSENT_CHANGE_EVENT = "nicchyo-consent-change";

export type ConsentValue = "accepted" | "declined" | null;

function readConsent(key: string): ConsentValue {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key);
  return value === "accepted" || value === "declined" ? value : null;
}

function writeConsent(key: string, value: Exclude<ConsentValue, null>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

export function isAnalyticsAllowed(): boolean {
  return getAnalyticsConsent() === "accepted";
}

export function isLocationAllowed(): boolean {
  return getLocationConsent() === "accepted";
}

export function getAnalyticsConsent(): ConsentValue {
  return readConsent(ANALYTICS_CONSENT_KEY);
}

export function getLocationConsent(): ConsentValue {
  return readConsent(LOCATION_CONSENT_KEY);
}

export function setAnalyticsConsent(value: Exclude<ConsentValue, null>): void {
  writeConsent(ANALYTICS_CONSENT_KEY, value);
}

export function setLocationConsent(value: Exclude<ConsentValue, null>): void {
  writeConsent(LOCATION_CONSENT_KEY, value);
}

export function loadGA(gaId: string): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);

  interface GtagWindow {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
  const w = window as Window & GtagWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.gtag = function (...args: unknown[]) {
    w.dataLayer!.push(args);
  };
  w.gtag("js", new Date());
  w.gtag("config", gaId);
}
