"use client";

import React, { useEffect, useState } from "react";
import { getConsent, setConsent, loadGA } from "@/lib/analytics/consentClient";

export default function CookieConsent() {
  const [consent, setLocalConsent] = useState<string | null>(null);

  useEffect(() => {
    const stored = getConsent();
    setLocalConsent(stored);
    if (stored === "accepted") {
      const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
      if (gaId && process.env.NODE_ENV === "production") {
        loadGA(gaId);
      }
    }
  }, []);

  if (consent !== null) return null; // already decided

  const accept = () => {
    setConsent("accepted");
    setLocalConsent("accepted");
    // trigger initial page_view after GA loaded
    setTimeout(() => {
      try {
        const w = window as any;
        if (typeof w?.gtag === "function") {
          w.gtag("event", "page_view", { page_path: window.location.pathname + window.location.search });
        }
      } catch {}
    }, 1000);
  };

  const decline = () => {
    setConsent("declined");
    setLocalConsent("declined");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-white/95 text-sm rounded-lg shadow-lg p-4 max-w-3xl w-[90%] md:w-auto pointer-events-auto">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="flex-1 text-gray-800">
            本サイトでは利用状況把握のために Google Analytics を利用しています。解析データの収集に同意しますか？
          </div>
          <div className="mt-3 md:mt-0 flex gap-2">
            <button
              className="bg-nicchyo-primary text-white px-3 py-1 rounded"
              onClick={accept}
            >
              同意する
            </button>
            <button
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded"
              onClick={decline}
            >
              同意しない
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
