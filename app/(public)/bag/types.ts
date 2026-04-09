import type { Shop } from "../map/data/shops";
import type { BagItem } from "../../../lib/storage/BagContext";

export type Mode = "plan" | "shop";
export type DraftItem = { name: string; qty: string; note: string };
export type GroupKey = number | "other";

export type BagGroup = {
  key: GroupKey;
  shop: Shop | null;
  routeOrder: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  isOther: boolean;
  items: BagItem[];
  uncheckedItems: BagItem[];
  checkedItems: BagItem[];
  checkedCount: number;
  totalPrice: number;
};
