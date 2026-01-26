import { describe, it, expect } from 'vitest';
import { getShopBannerImage } from './shopImages';

describe('getShopBannerImage', () => {
  // Constants from the source file for verification
  // Note: We are testing public API behavior, but knowing expected values helps.
  const DEFAULT_BANNER = "/images/shops/tosahamono.webp";
  const INGREDIENT_IMAGES = ["/images/shops/ninjin.webp", "/images/shops/retasu.webp"];

  describe('Edge Cases (Empty or Invalid Input)', () => {
    it('returns the default banner when category is null', () => {
      const result = getShopBannerImage(null);
      expect(result).toBe(DEFAULT_BANNER);
    });

    it('returns the default banner when category is undefined', () => {
      const result = getShopBannerImage(undefined);
      expect(result).toBe(DEFAULT_BANNER);
    });

    it('returns the default banner when category is unknown', () => {
      const result = getShopBannerImage('Unknown Category');
      expect(result).toBe(DEFAULT_BANNER);
    });
  });

  describe('Valid Input (Known Categories)', () => {
    it('returns a valid image for "食材" category', () => {
      const result = getShopBannerImage('食材');
      expect(INGREDIENT_IMAGES).toContain(result);
    });

    it('returns a valid image for "生活雑貨" category', () => {
      const GOODS_IMAGES = [
        "/images/shops/takekago.webp",
        "/images/shops/dish.webp",
        "/images/shops/towel.webp",
      ];
      const result = getShopBannerImage('生活雑貨');
      expect(GOODS_IMAGES).toContain(result);
    });
  });

  describe('Deterministic Behavior with Seed', () => {
    it('returns the same image for the same numeric seed', () => {
      const category = '食材';
      const seed = 12345;

      const result1 = getShopBannerImage(category, seed);
      const result2 = getShopBannerImage(category, seed);

      expect(result1).toBe(result2);
    });

    it('returns the same image for the same string seed', () => {
      const category = '食材';
      const seed = 'shop-123';

      const result1 = getShopBannerImage(category, seed);
      const result2 = getShopBannerImage(category, seed);

      expect(result1).toBe(result2);
    });

  });
});
