/**
 * 日曜市の店舗データ
 *
 * 旧静的データは廃止し、DB/API から取得する前提に変更。
 */

import type { Shop as ShopType } from "../types/shopData";
export type { Shop } from "../types/shopData";

export const shops: ShopType[] = [];

export const SHOP_CATEGORY_NAMES = [
  '食材',
  '食べ物',
  '道具・工具',
  '生活雑貨',
  '植物・苗',
  'アクセサリー',
  '手作り・工芸',
] as const;
