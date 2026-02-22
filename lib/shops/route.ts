export const MIN_SHOP_ID = 1;
export const MAX_SHOP_ID = 300;

const SHOP_CODE_PATTERN = /^\d{3}$/;
const SHOPS_PATH_SEGMENT_PATTERN = /^shops(\d{3})$/;

export function normalizeShopCodeToId(shopCode: string): number | null {
  if (!SHOP_CODE_PATTERN.test(shopCode)) {
    return null;
  }

  const shopId = Number.parseInt(shopCode, 10);

  if (Number.isNaN(shopId) || shopId < MIN_SHOP_ID || shopId > MAX_SHOP_ID) {
    return null;
  }

  return shopId;
}

export function normalizeShopsPathSegmentToId(shopSegment: string): number | null {
  const match = shopSegment.match(SHOPS_PATH_SEGMENT_PATTERN);

  if (!match) {
    return null;
  }

  return normalizeShopCodeToId(match[1]);
}

export function formatShopIdToCode(shopId: number): string | null {
  if (!Number.isInteger(shopId) || shopId < MIN_SHOP_ID || shopId > MAX_SHOP_ID) {
    return null;
  }

  return shopId.toString().padStart(3, "0");
}
