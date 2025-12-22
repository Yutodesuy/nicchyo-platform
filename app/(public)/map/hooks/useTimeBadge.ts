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
    const id = window.setInterval(() => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      const now = new Date();
      // geolocationを取得（タイムアウト短め）
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const res = claimTimeBadge(now, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          if (res) {
            setPriority({
              message: `${res.slot}に日曜市に訪れました！`,
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
    }, 15000);

    return () => window.clearInterval(id);
  }, []);

  const clearPriority = () => setPriority(null);

  return { priority, clearPriority };
}
