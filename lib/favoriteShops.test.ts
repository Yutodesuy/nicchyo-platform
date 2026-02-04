import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadFavoriteShopIds,
  saveFavoriteShopIds,
  toggleFavoriteShopId,
  FAVORITE_SHOPS_KEY,
  FAVORITE_SHOPS_UPDATED_EVENT,
} from './favoriteShops';

describe('favoriteShops', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loadFavoriteShopIds', () => {
    it('returns empty array when storage is empty', () => {
      expect(loadFavoriteShopIds()).toEqual([]);
    });

    it('returns parsed ids when storage has valid json', () => {
      localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify([1, 2, 3]));
      expect(loadFavoriteShopIds()).toEqual([1, 2, 3]);
    });

    it('normalizes values: converts strings to numbers, handles distinct values', () => {
      // "2" -> 2
      // null -> 0 (Number(null) === 0)
      // Duplicate 1 -> filtered by Set
      localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify([1, "2", null, 1, 3]));
      expect(loadFavoriteShopIds()).toEqual([1, 2, 0, 3]);
    });

    it('filters out invalid numbers', () => {
      // "abc" -> NaN
      localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify([1, "abc", 3]));
      expect(loadFavoriteShopIds()).toEqual([1, 3]);
    });

    it('returns empty array if JSON is invalid', () => {
      localStorage.setItem(FAVORITE_SHOPS_KEY, '{invalid-json}');
      expect(loadFavoriteShopIds()).toEqual([]);
    });
  });

  describe('saveFavoriteShopIds', () => {
    it('saves ids to localStorage', () => {
      saveFavoriteShopIds([10, 20]);
      expect(localStorage.getItem(FAVORITE_SHOPS_KEY)).toBe(JSON.stringify([10, 20]));
    });

    it('dispatches update event', () => {
      const listener = vi.fn();
      window.addEventListener(FAVORITE_SHOPS_UPDATED_EVENT, listener);

      saveFavoriteShopIds([5]);

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual([5]);

      window.removeEventListener(FAVORITE_SHOPS_UPDATED_EVENT, listener);
    });

    it('normalizes inputs before saving', () => {
      // @ts-expect-error testing runtime behavior with invalid inputs
      saveFavoriteShopIds([1, "2", "abc"]);
      expect(localStorage.getItem(FAVORITE_SHOPS_KEY)).toBe(JSON.stringify([1, 2]));
    });
  });

  describe('toggleFavoriteShopId', () => {
    it('adds id if not present', () => {
      localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify([1, 2]));
      const result = toggleFavoriteShopId(3);

      expect(result).toEqual([1, 2, 3]);
      expect(loadFavoriteShopIds()).toEqual([1, 2, 3]);
    });

    it('removes id if present', () => {
      localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify([1, 2, 3]));
      const result = toggleFavoriteShopId(2);

      expect(result).toEqual([1, 3]);
      expect(loadFavoriteShopIds()).toEqual([1, 3]);
    });

    it('handles empty initial state correctly', () => {
      const result = toggleFavoriteShopId(100);
      expect(result).toEqual([100]);
      expect(loadFavoriteShopIds()).toEqual([100]);
    });
  });
});
