import type { GrandmaCommentGenre } from '../types/grandmaComment';

export type TimeBadgeTier = {
  count: number;
  title: string;
  icon: string;
};

export type TimeBadge = {
  slot: string; // "HH:MM"
  title: string;
  icon: string;
  tiers: TimeBadgeTier[];
  genre?: GrandmaCommentGenre;
};

const TIERS: TimeBadgeTier[] = [
  { count: 1, title: 'Bronze', icon: '🥉' },
  { count: 3, title: 'Silver', icon: '🥈' },
  { count: 5, title: 'Gold', icon: '🥇' },
];

/**
 * 5:00〜17:00 の30分刻みスロット用バッジ。
 * スロットごとにタイトルを変え、tierは共通。
 */
export const timeBadgeMaster: TimeBadge[] = (() => {
  const slots: string[] = [];
  for (let h = 5; h <= 17; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h !== 17) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots.map((slot) => ({
    slot,
    title: `${slot} 来訪バッジ`,
    icon: '🕰️',
    tiers: TIERS,
    genre: 'event',
  }));
})();
