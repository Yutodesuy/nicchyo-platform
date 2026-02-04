import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSearchMapPayload,
  saveSearchMapPayload,
  SEARCH_MAP_STORAGE_KEY,
  type SearchMapPayload,
} from './searchMapStorage';

describe('searchMapStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('saveSearchMapPayload', () => {
    it('saves payload to localStorage', () => {
      const payload: SearchMapPayload = { ids: [1, 2], label: 'Test' };
      saveSearchMapPayload(payload);
      expect(localStorage.getItem(SEARCH_MAP_STORAGE_KEY)).toBe(JSON.stringify(payload));
    });

    it('handles potential storage errors gracefully', () => {
        // Mock setItem to throw
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceeded');
        });
        const payload: SearchMapPayload = { ids: [1], label: 'Test' };
        // Should not throw
        expect(() => saveSearchMapPayload(payload)).not.toThrow();
    });
  });

  describe('loadSearchMapPayload', () => {
    it('returns null when storage is empty', () => {
      expect(loadSearchMapPayload()).toBeNull();
    });

    it('returns payload when valid json exists', () => {
      const payload = { ids: [1, 2], label: 'Test' };
      localStorage.setItem(SEARCH_MAP_STORAGE_KEY, JSON.stringify(payload));
      expect(loadSearchMapPayload()).toEqual(payload);
    });

    it('returns null when json is invalid', () => {
      localStorage.setItem(SEARCH_MAP_STORAGE_KEY, '{invalid');
      expect(loadSearchMapPayload()).toBeNull();
    });

    it('returns null when structure is invalid (missing ids)', () => {
      localStorage.setItem(SEARCH_MAP_STORAGE_KEY, JSON.stringify({ label: 'Test' }));
      expect(loadSearchMapPayload()).toBeNull();
    });

    it('returns null when structure is invalid (missing label)', () => {
      localStorage.setItem(SEARCH_MAP_STORAGE_KEY, JSON.stringify({ ids: [1] }));
      expect(loadSearchMapPayload()).toBeNull();
    });

    it('returns null when structure is invalid (ids not array)', () => {
      localStorage.setItem(SEARCH_MAP_STORAGE_KEY, JSON.stringify({ ids: "bad", label: 'Test' }));
      expect(loadSearchMapPayload()).toBeNull();
    });
  });
});
