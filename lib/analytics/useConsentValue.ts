"use client";

import { useEffect, useState } from "react";
import { getAnalyticsConsent, getLocationConsent } from "./consentClient";
import type { ConsentValue } from "./consentClient";

const CONSENT_CHANGE_EVENT = "nicchyo-consent-change";

export function useConsentValue(kind: "analytics" | "location"): ConsentValue {
  const [value, setValue] = useState<ConsentValue>(null);

  useEffect(() => {
    const read = kind === "analytics" ? getAnalyticsConsent : getLocationConsent;
    const sync = () => setValue(read());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
    };
  }, [kind]);

  return value;
}
