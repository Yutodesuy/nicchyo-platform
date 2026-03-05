import { useEffect, useState } from "react";
import type { Shop } from "@/app/(public)/map/data/shops";

type ShopsResponse = { shops?: Shop[] };

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/shops");
        if (!response.ok) {
          throw new Error(`Failed to load shops: ${response.status}`);
        }
        const payload = (await response.json()) as ShopsResponse;
        if (!cancelled) {
          setShops(Array.isArray(payload.shops) ? payload.shops : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setShops([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { shops, isLoading, error };
}
