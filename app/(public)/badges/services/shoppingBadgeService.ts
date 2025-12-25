import { shops } from '../../map/data/shops';

const STORAGE_KEY = 'nicchyo-fridge-items';

type BagItem = {
  id: string;
  name: string;
  fromShopId?: number;
  createdAt: number;
};

export type ShoppingSegment = {
  id: string;
  label: string;
  color: string;
  keywords: string[];
};

export const SHOPPING_SEGMENTS: ShoppingSegment[] = [
  { id: 'veggies', label: '野菜', color: '#22c55e', keywords: ['野菜', '菜', '大根', '人参', 'にんじん', 'ねぎ', 'ネギ', '芋', '葉'] },
  { id: 'fish', label: '魚', color: '#3b82f6', keywords: ['魚', '鮮魚', '鰹', 'かつお', 'カツオ', '鯖', 'サバ', '鰯', 'いわし', '干物'] },
  { id: 'fruit', label: '果物', color: '#f97316', keywords: ['果物', 'みかん', '柑橘', 'りんご', 'リンゴ', '梨', 'ぶどう', '葡萄', '柿'] },
  { id: 'flowers', label: '花', color: '#ec4899', keywords: ['花', '切り花', '苗', '盆栽', 'ブーケ'] },
  { id: 'snacks', label: 'おやつ', color: '#f59e0b', keywords: ['おやつ', 'パン', 'スイーツ', '餅', 'まんじゅう', 'ケーキ'] },
  { id: 'drinks', label: '飲み物', color: '#6366f1', keywords: ['お茶', 'コーヒー', '飲み', 'ジュース', '酒', 'ビール', 'ワイン'] },
];

const shopCategoryMap: Record<string, string> = {
  vegetables: 'veggies',
  fish: 'fish',
  fruits: 'fruit',
  flowers: 'flowers',
  snacks: 'snacks',
  drinks: 'drinks',
};

function loadBagItems(): BagItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BagItem[];
  } catch {
    return [];
  }
}

function normalize(text: string) {
  return text.toLowerCase();
}

function matchKeyword(name: string, segment: ShoppingSegment) {
  const n = normalize(name);
  return segment.keywords.some((kw) => n.includes(normalize(kw)));
}

function mapShopCategory(shopId?: number): string | undefined {
  if (!shopId) return undefined;
  const shop = shops.find((s) => s.id === shopId);
  if (!shop?.category) return undefined;
  return shopCategoryMap[shop.category] ?? undefined;
}

export function getShoppingProgress() {
  const items = loadBagItems();
  const unlocked = new Set<string>();

  for (const item of items) {
    const fromShopCategory = mapShopCategory(item.fromShopId);
    if (fromShopCategory) {
      unlocked.add(fromShopCategory);
      continue;
    }

    for (const seg of SHOPPING_SEGMENTS) {
      if (matchKeyword(item.name, seg)) {
        unlocked.add(seg.id);
        break;
      }
    }
  }

  return {
    unlocked,
    itemsCount: items.length,
  };
}
