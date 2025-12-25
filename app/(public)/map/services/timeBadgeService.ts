import { getRoadBounds } from '../config/roadConfig';
import { timeBadgeMaster, type TimeBadge } from '../data/timeBadgeMaster';

type Position = { lat: number; lng: number };

type SlotProgress = {
  count: number;
  lastDate: string; // yyyy-mm-dd
};

type StoredProgress = {
  lastSlot?: string;
  lastDate?: string;
  slots: Record<string, SlotProgress>;
};

export type TimeBadgeResult = {
  slot: string;
  badge: TimeBadge;
  tierTitle: string;
  tierIcon: string;
  count: number;
};

export type TimeBadgeProgress = {
  slot: string;
  badge: TimeBadge;
  count: number;
  lastDate?: string;
  tierTitle?: string;
  tierIcon?: string;
};

const STORAGE_KEY = 'nicchyo-time-badges';
const BOUNDS = getRoadBounds();

function normalizeBounds(bounds: [[number, number], [number, number]]) {
  const [nw, se] = bounds;
  const minLat = Math.min(nw[0], se[0]);
  const maxLat = Math.max(nw[0], se[0]);
  const minLng = Math.min(nw[1], se[1]);
  const maxLng = Math.max(nw[1], se[1]);
  return { minLat, maxLat, minLng, maxLng };
}

function loadProgress(): StoredProgress {
  if (typeof window === 'undefined') return { slots: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { slots: {} };
    return JSON.parse(raw) as StoredProgress;
  } catch {
    return { slots: {} };
  }
}

function saveProgress(data: StoredProgress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isSunday(now: Date) {
  return now.getDay() === 0;
}

function isWithinTimeRange(now: Date) {
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < 5 || h > 17) return false;
  if (h === 17 && m > 0) return false;
  return m === 0 || m === 30;
}

function formatSlot(now: Date): string {
  return `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

const NORMALIZED = normalizeBounds(BOUNDS);

function isInsideBounds(pos: Position) {
  return (
    pos.lat >= NORMALIZED.minLat &&
    pos.lat <= NORMALIZED.maxLat &&
    pos.lng >= NORMALIZED.minLng &&
    pos.lng <= NORMALIZED.maxLng
  );
}

function todayString(now: Date) {
  return now.toISOString().slice(0, 10);
}

function findBadge(slot: string) {
  return timeBadgeMaster.find((b) => b.slot === slot);
}

function computeTier(badge: TimeBadge, count: number) {
  const sorted = [...badge.tiers].sort((a, b) => a.count - b.count);
  let tier = sorted[0];
  for (const t of sorted) {
    if (count >= t.count) tier = t;
  }
  return tier;
}

export function listTimeBadgeProgress(): TimeBadgeProgress[] {
  const progress = loadProgress();
  return timeBadgeMaster.map((badge) => {
    const slotProgress = progress.slots[badge.slot];
    const count = slotProgress?.count ?? 0;
    const tier =
      count > 0
        ? computeTier(badge, count)
        : undefined;

    return {
      slot: badge.slot,
      badge,
      count,
      lastDate: slotProgress?.lastDate,
      tierTitle: tier?.title,
      tierIcon: tier?.icon,
    };
  });
}

/**
 * Try to claim a time badge; returns null if conditions are not met.
 */
export function claimTimeBadge(now: Date, pos: Position): TimeBadgeResult | null {
  if (!isSunday(now)) return null;
  if (!isWithinTimeRange(now)) return null;
  if (!isInsideBounds(pos)) return null;

  const slot = formatSlot(now);
  const badge = findBadge(slot);
  if (!badge) return null;

  const today = todayString(now);
  const progress = loadProgress();
  const slotProgress = progress.slots[slot] ?? { count: 0, lastDate: '' };

  // Only once per slot per day
  if (slotProgress.lastDate === today) {
    return null;
  }

  const nextCount = slotProgress.count + 1;
  const tier = computeTier(badge, nextCount);

  progress.slots[slot] = { count: nextCount, lastDate: today };
  progress.lastSlot = slot;
  progress.lastDate = today;
  saveProgress(progress);

  return {
    slot,
    badge,
    tierTitle: tier.title,
    tierIcon: tier.icon,
    count: nextCount,
  };
}
