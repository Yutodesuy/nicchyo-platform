import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { BagProvider, useBag } from './BagContext';
import React, { useEffect } from 'react';

const STORAGE_KEY = 'nicchyo-fridge-items';

describe('BagContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BagProvider>{children}</BagProvider>
  );

  describe('initialization', () => {
    it('loads items from localStorage on mount', () => {
      const mockItems = [{ id: '1', name: 'Tomato', createdAt: 12345 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

      const { result } = renderHook(() => useBag(), { wrapper });

      expect(result.current.items).toEqual(mockItems);
    });

    it('handles invalid JSON in localStorage safely', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useBag(), { wrapper });

      expect(result.current.items).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('[BagContext] Failed to load bag items:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('starts empty when localStorage is empty', () => {
      const { result } = renderHook(() => useBag(), { wrapper });
      expect(result.current.items).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('adds an item to the bag and saves to localStorage (debounced)', () => {
      const { result } = renderHook(() => useBag(), { wrapper });

      act(() => {
        result.current.addItem({ name: 'Apple', price: 100 });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toMatchObject({
        name: 'Apple',
        price: 100
      });
      expect(result.current.items[0].id).toBeDefined();
      expect(result.current.items[0].createdAt).toBeDefined();

      // Before timeout, localStorage is empty
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // After timeout, it's saved
      const savedItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(savedItems).toHaveLength(1);
      expect(savedItems[0].name).toBe('Apple');
    });

    it('prevents adding duplicates', () => {
      const { result } = renderHook(() => useBag(), { wrapper });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.addItem({ name: 'Apple', fromShopId: 1 });
      });

      expect(result.current.items).toHaveLength(1);

      // Add exactly the same name and shop ID
      act(() => {
        result.current.addItem({ name: 'apple ', fromShopId: 1 });
      });

      expect(result.current.items).toHaveLength(1); // Still 1
      expect(consoleWarnSpy).toHaveBeenCalledWith('[BagContext] Item already exists:', 'apple ');

      // Add same name, different shop ID (should add)
      act(() => {
        result.current.addItem({ name: 'Apple', fromShopId: 2 });
      });

      expect(result.current.items).toHaveLength(2);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('removes an item by id', () => {
      const mockItems = [
        { id: '1', name: 'Tomato', createdAt: 100 },
        { id: '2', name: 'Potato', createdAt: 200 }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

      const { result } = renderHook(() => useBag(), { wrapper });

      act(() => {
        result.current.removeItem('1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('2');
    });
  });

  describe('updateItem', () => {
    it('updates an existing item by id', () => {
      const mockItems = [
        { id: '1', name: 'Tomato', price: 100, createdAt: 100 }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

      const { result } = renderHook(() => useBag(), { wrapper });

      act(() => {
        result.current.updateItem('1', { price: 200, qty: '2 pcs' });
      });

      expect(result.current.items[0]).toMatchObject({
        name: 'Tomato',
        price: 200,
        qty: '2 pcs'
      });
    });
  });

  describe('isInBag', () => {
    it('checks if item is in bag by name and optionally shopId', () => {
      const mockItems = [
        { id: '1', name: 'Tomato', fromShopId: 10, createdAt: 100 },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

      const { result } = renderHook(() => useBag(), { wrapper });

      expect(result.current.isInBag('tomato')).toBe(true); // Ignore case
      expect(result.current.isInBag(' Tomato ')).toBe(true); // Ignore whitespace
      expect(result.current.isInBag('Potato')).toBe(false);

      expect(result.current.isInBag('Tomato', 10)).toBe(true); // Matching shopId
      expect(result.current.isInBag('Tomato', 20)).toBe(false); // Different shopId
    });
  });

  describe('clearBag', () => {
    it('clears all items', () => {
      const mockItems = [
        { id: '1', name: 'Tomato', createdAt: 100 },
        { id: '2', name: 'Potato', createdAt: 200 }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

      const { result } = renderHook(() => useBag(), { wrapper });

      act(() => {
        result.current.clearBag();
      });

      expect(result.current.items).toEqual([]);
    });
  });

  describe('totalPrice', () => {
    it('calculates total price correctly', () => {
      const mockItems = [
        { id: '1', name: 'Tomato', price: 100, createdAt: 100 },
        { id: '2', name: 'Potato', price: 250, createdAt: 200 },
        { id: '3', name: 'Onion', createdAt: 300 } // No price
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

      const { result } = renderHook(() => useBag(), { wrapper });

      expect(result.current.totalPrice).toBe(350);
    });
  });

  describe('storage event sync', () => {
    it('syncs state when storage event fires from another tab', () => {
      const { result } = renderHook(() => useBag(), { wrapper });

      expect(result.current.items).toEqual([]);

      const mockItems = [{ id: '99', name: 'Remote Item', createdAt: 999 }];

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(mockItems),
          })
        );
      });

      expect(result.current.items).toEqual(mockItems);
    });

    it('clears state when storage event fires with empty newValue', () => {
      const mockItems = [{ id: '99', name: 'Remote Item', createdAt: 999 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems));

      const { result } = renderHook(() => useBag(), { wrapper });
      expect(result.current.items).toHaveLength(1);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: null,
          })
        );
      });

      expect(result.current.items).toEqual([]);
    });
  });

  describe('useBag without provider', () => {
    it('throws error if used outside provider', () => {
      // Temporarily suppress console.error for expected thrown error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useBag())).toThrow('useBag must be used within BagProvider');

      consoleErrorSpy.mockRestore();
    });
  });
});
