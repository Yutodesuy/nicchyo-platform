const CONSENT_KEY = "nicchyo_ga_consent";

export function isAnalyticsAllowed(): boolean {
  return getConsent() === "accepted";
}

export function getConsent(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONSENT_KEY);
}

export function setConsent(value: "accepted" | "declined"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, value);
}

export function loadGA(gaId: string): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function (...args: any[]) {
    w.dataLayer.push(args);
  };
  w.gtag("js", new Date());
  w.gtag("config", gaId);
}
