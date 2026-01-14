import { useEffect, useRef, useState } from 'react';
import { claimTimeBadge, type TimeBadgeResult } from '../services/timeBadgeService';

type PriorityState = {
  message: string;
  badge: TimeBadgeResult;
};

export function useTimeBadge() {
  const [priority, setPriority] = useState<PriorityState | null>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    let intervalId: number | null = null;

    const tick = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      const now = new Date();
      // Keep geolocation lightweight; low frequency and low accuracy
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const res = claimTimeBadge(now, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          if (res) {
            setPriority({
              message: `${res.slot}に日曜市へ訪れました！`,
              badge: res,
            });
          }
          tickingRef.current = false;
        },
        () => {
          tickingRef.current = false;
        },
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
      );
    };

    const start = () => {
      if (intervalId !== null) return;
      tick();
      intervalId = window.setInterval(tick, 15000);
    };

    const stop = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const clearPriority = () => setPriority(null);

  return { priority, clearPriority };
}
