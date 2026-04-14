import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  incrementBannerOpens,
  getBannerOpens,
  recordMarketEnter,
  recordMarketExit,
  getAccumulatedMarketTimeMs,
} from './marketStats';

describe('marketStats', () => {
  let originalWindow: typeof window;

  beforeEach(() => {
    // Save original window and localStorage
    originalWindow = global.window;
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    // Restore window
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('bannerOpens', () => {
    it('returns 0 when there are no banner opens', () => {
      expect(getBannerOpens()).toBe(0);
    });

    it('increments banner opens correctly', () => {
      incrementBannerOpens();
      expect(getBannerOpens()).toBe(1);

      incrementBannerOpens();
      expect(getBannerOpens()).toBe(2);
    });

    it('handles undefined window safely for getBannerOpens', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(getBannerOpens()).toBe(0);
      global.window = originalWindow;
    });

    it('handles undefined window safely for incrementBannerOpens', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(() => incrementBannerOpens()).not.toThrow();
      global.window = originalWindow;
    });
  });

  describe('marketTimeMs', () => {
    it('records market enter and sets entry timestamp', () => {
      vi.setSystemTime(new Date(1000));
      recordMarketEnter();
      expect(localStorage.getItem('nicchyo-market-entry-ts')).toBe('1000');
    });

    it('does not overwrite entry timestamp if already entered', () => {
      vi.setSystemTime(new Date(1000));
      recordMarketEnter();

      vi.setSystemTime(new Date(2000));
      recordMarketEnter();
      expect(localStorage.getItem('nicchyo-market-entry-ts')).toBe('1000');
    });

    it('handles undefined window safely for recordMarketEnter', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(() => recordMarketEnter()).not.toThrow();
      global.window = originalWindow;
    });

    it('calculates accumulated time correctly while entered', () => {
      vi.setSystemTime(new Date(1000));
      recordMarketEnter();

      vi.setSystemTime(new Date(2500));
      expect(getAccumulatedMarketTimeMs()).toBe(1500);
    });

    it('records exit and accumulates time', () => {
      vi.setSystemTime(new Date(1000));
      recordMarketEnter();

      vi.setSystemTime(new Date(3000));
      recordMarketExit();

      expect(localStorage.getItem('nicchyo-market-entry-ts')).toBeNull();
      expect(localStorage.getItem('nicchyo-market-time-ms')).toBe('2000');
      expect(getAccumulatedMarketTimeMs()).toBe(2000);
    });

    it('does nothing on exit if never entered', () => {
      recordMarketExit();
      expect(localStorage.getItem('nicchyo-market-time-ms')).toBeNull();
    });

    it('accumulates time correctly across multiple sessions', () => {
      // Session 1
      vi.setSystemTime(new Date(1000));
      recordMarketEnter();
      vi.setSystemTime(new Date(3000));
      recordMarketExit(); // 2000ms

      // Session 2
      vi.setSystemTime(new Date(5000));
      recordMarketEnter();
      vi.setSystemTime(new Date(6000));

      // getAccumulatedMarketTimeMs calculates: base(2000) + elapsed(1000) = 3000ms
      expect(getAccumulatedMarketTimeMs()).toBe(3000);

      recordMarketExit(); // accumulated(3000) + elapsed(1000) = 3000ms total
      expect(getAccumulatedMarketTimeMs()).toBe(3000);
    });

    it('handles undefined window safely for recordMarketExit', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(() => recordMarketExit()).not.toThrow();
      global.window = originalWindow;
    });

    it('handles undefined window safely for getAccumulatedMarketTimeMs', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(getAccumulatedMarketTimeMs()).toBe(0);
      global.window = originalWindow;
    });
  });
});
