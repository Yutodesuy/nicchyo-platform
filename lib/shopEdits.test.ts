import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadShopEdits,
  saveShopEdits,
  applyShopEdits,
  SHOP_EDITS_STORAGE_KEY,
  SHOP_EDITS_UPDATED_EVENT
} from './shopEdits';
import type { Shop, ShopEditableData } from '@/app/(public)/map/types/shopData';

// Mock shop data
const mockShop: Shop = {
  id: 1,
  name: 'Test Shop',
  ownerName: 'Test Owner',
  category: 'food',
  icon: 'food-icon',
  products: ['product1'],
  description: 'Original Description',
  schedule: 'Mon-Fri',
  position: 1,
  lat: 0,
  lng: 0,
  side: 'north',
  visible: true,
  images: {
    main: 'original-main.jpg',
    thumbnail: 'original-thumb.jpg'
  },
  socialLinks: {
    twitter: 'original-twitter',
    website: 'original-website'
  }
};

describe('shopEdits', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadShopEdits', () => {
    it('should return empty object if no edits exist', () => {
      const result = loadShopEdits(1);
      expect(result).toEqual({});
    });

    it('should return stored edits for the given shopId', () => {
      const edits: Partial<ShopEditableData> = { name: 'Edited Name' };
      const storageData = { '1': edits };
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify(storageData));

      const result = loadShopEdits(1);
      expect(result).toEqual(edits);
    });

    it('should return empty object for non-existent shopId', () => {
      const edits: Partial<ShopEditableData> = { name: 'Edited Name' };
      const storageData = { '1': edits };
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify(storageData));

      const result = loadShopEdits(2);
      expect(result).toEqual({});
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, 'invalid-json');
      const result = loadShopEdits(1);
      expect(result).toEqual({});
    });
  });

  describe('saveShopEdits', () => {
    it('should save edits to localStorage', () => {
      const edits: Partial<ShopEditableData> = { name: 'New Name' };
      saveShopEdits(1, edits);

      const stored = localStorage.getItem(SHOP_EDITS_STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed['1']).toEqual(edits);
    });

    it('should merge with existing edits for other shops', () => {
      // Setup existing data
      const existingEdits = { '2': { name: 'Shop 2' } };
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify(existingEdits));

      // Save new edit for shop 1
      const newEdits: Partial<ShopEditableData> = { name: 'Shop 1' };
      saveShopEdits(1, newEdits);

      const stored = localStorage.getItem(SHOP_EDITS_STORAGE_KEY);
      const parsed = JSON.parse(stored!);

      expect(parsed['1']).toEqual(newEdits);
      expect(parsed['2']).toEqual(existingEdits['2']);
    });

    it('should dispatch update event', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      saveShopEdits(1, { name: 'New Name' });

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe(SHOP_EDITS_UPDATED_EVENT);
      expect(event.detail).toEqual({ shopId: 1 });
    });
  });

  describe('applyShopEdits', () => {
    it('should return original shops if no edits exist', () => {
      const shops = [mockShop];
      const result = applyShopEdits(shops);
      expect(result).toEqual(shops);
    });

    it('should apply simple field edits', () => {
      const edits: Partial<ShopEditableData> = {
        name: 'Edited Shop Name',
        description: 'Edited Description'
      };
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify({ '1': edits }));

      const shops = [mockShop];
      const result = applyShopEdits(shops);

      expect(result[0].name).toBe(edits.name);
      expect(result[0].description).toBe(edits.description);
      // Other fields should remain unchanged
      expect(result[0].category).toBe(mockShop.category);
    });

    it('should merge nested images object', () => {
      const edits: Partial<ShopEditableData> = {
        images: {
          main: 'new-main.jpg'
          // thumbnail is missing in edits, should keep original
        }
      };
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify({ '1': edits }));

      const shops = [mockShop];
      const result = applyShopEdits(shops);

      expect(result[0].images?.main).toBe('new-main.jpg');
      expect(result[0].images?.thumbnail).toBe('original-thumb.jpg');
    });

    it('should merge nested socialLinks object', () => {
      const edits: Partial<ShopEditableData> = {
        socialLinks: {
          instagram: 'new-instagram'
        }
      };
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify({ '1': edits }));

      const shops = [mockShop];
      const result = applyShopEdits(shops);

      expect(result[0].socialLinks?.instagram).toBe('new-instagram');
      expect(result[0].socialLinks?.twitter).toBe('original-twitter');
      expect(result[0].socialLinks?.website).toBe('original-website');
    });

    it('should only affect target shop', () => {
      const shop2 = { ...mockShop, id: 2, name: 'Shop 2' };
      const shops = [mockShop, shop2];

      const edits = { name: 'Edited Shop 1' };
      localStorage.setItem(SHOP_EDITS_STORAGE_KEY, JSON.stringify({ '1': edits }));

      const result = applyShopEdits(shops);

      expect(result[0].name).toBe('Edited Shop 1');
      expect(result[1].name).toBe('Shop 2');
    });
  });
});
