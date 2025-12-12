export type KotoduteNote = {
  id: string;
  shopId: number | "all";
  text: string;
  createdAt: number;
};

const STORAGE_KEY = "nicchyo-kotodute-notes";

const seed: KotoduteNote[] = [
  {
    id: "seed-1",
    shopId: 12,
    text: "朝どれナスが甘い！#12",
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "seed-2",
    shopId: "all",
    text: "雨の日は全体的に値下げしてました #all",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: "seed-3",
    shopId: 45,
    text: "カツオのたたきが香ばしい！#45",
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
  },
];

export function loadKotodute(): KotoduteNote[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seed;
  try {
    const parsed = JSON.parse(raw) as KotoduteNote[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed;
    return parsed;
  } catch {
    return seed;
  }
}

export function saveKotodute(notes: KotoduteNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
