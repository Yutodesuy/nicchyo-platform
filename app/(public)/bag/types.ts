import type { Shop } from "../map/data/shops";
import type { BagItem } from "../../../lib/storage/BagContext";

export type DraftItem = {
  name: string;
  qty: string;
  note: string;
};

export type GroupKey = number | "other";

export type BagGroup = {
  key: GroupKey;
  shop: Shop | null;
  title: string;
  subtitle: string;
  imageUrl?: string;
  isOther: boolean;
  items: BagItem[];
};
