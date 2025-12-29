"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type MapLoadingContextValue = {
  isMapLoading: boolean;
  startMapLoading: () => void;
  stopMapLoading: () => void;
};

const MapLoadingContext = createContext<MapLoadingContextValue | null>(null);

export function useMapLoading() {
  const value = useContext(MapLoadingContext);
  if (!value) {
    throw new Error("useMapLoading must be used within MapLoadingProvider");
  }
  return value;
}

export default function MapLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isMapLoading, setIsMapLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isMapLoading) {
      setIsMapLoading(false);
    }
  }, [pathname, isMapLoading]);

  const value = useMemo(
    () => ({
      isMapLoading,
      startMapLoading: () => {
        if (pathname?.startsWith("/map")) return;
        setIsMapLoading(true);
      },
      stopMapLoading: () => setIsMapLoading(false),
    }),
    [isMapLoading, pathname]
  );

  return (
    <MapLoadingContext.Provider value={value}>
      {children}
      {isMapLoading && <MapLoadingOverlay />}
    </MapLoadingContext.Provider>
  );
}

function MapLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-800">
      <div className="flex flex-col items-center gap-4">
        <div className="map-walker relative h-20 w-20 text-amber-700">
          <svg
            className="map-walker-frame is-1"
            viewBox="0 0 80 80"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="40" cy="16" r="6" />
            <line x1="40" y1="22" x2="40" y2="46" />
            <line x1="40" y1="30" x2="28" y2="36" />
            <line x1="40" y1="30" x2="52" y2="34" />
            <line x1="40" y1="46" x2="30" y2="64" />
            <line x1="40" y1="46" x2="52" y2="62" />
          </svg>

          <svg
            className="map-walker-frame is-2"
            viewBox="0 0 80 80"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="40" cy="16" r="6" />
            <line x1="40" y1="22" x2="40" y2="46" />
            <line x1="40" y1="30" x2="30" y2="34" />
            <line x1="40" y1="30" x2="54" y2="38" />
            <line x1="40" y1="46" x2="28" y2="62" />
            <line x1="40" y1="46" x2="54" y2="64" />
          </svg>

          <svg
            className="map-walker-frame is-3"
            viewBox="0 0 80 80"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="40" cy="16" r="6" />
            <line x1="40" y1="22" x2="40" y2="46" />
            <line x1="40" y1="30" x2="26" y2="38" />
            <line x1="40" y1="30" x2="54" y2="36" />
            <line x1="40" y1="46" x2="34" y2="64" />
            <line x1="40" y1="46" x2="56" y2="58" />
          </svg>
        </div>
        <div className="text-xs font-semibold tracking-[0.35em] text-amber-700">LOADING</div>
      </div>
    </div>
  );
}
