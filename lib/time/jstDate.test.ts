import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { todayJstString } from './jstDate';

describe('jstDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('todayJstString', () => {
    it('returns the correctly formatted date string for JST timezone', () => {
      // Mock Date to a specific UTC time: 2023-12-31T23:00:00Z
      // In JST (UTC+9), this is 2024-01-01T08:00:00
      const mockDate = new Date('2023-12-31T23:00:00Z');
      vi.setSystemTime(mockDate);

      const result = todayJstString();
      expect(result).toBe('2024-01-01');
    });

    it('returns the correctly formatted date string when in summer (no DST in JST)', () => {
      // 2023-08-15T10:00:00Z -> JST: 2023-08-15T19:00:00
      const mockDate = new Date('2023-08-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      const result = todayJstString();
      expect(result).toBe('2023-08-15');
    });

    it('throws an error if formatting parts are missing', () => {
      // Mock Intl.DateTimeFormat to return missing parts
      const mockFormatToParts = vi.fn().mockReturnValue([
        { type: 'year', value: '2023' },
        { type: 'month', value: '10' }
        // Missing 'day'
      ]);

      const originalDateTimeFormat = Intl.DateTimeFormat;
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function() {
        return {
          formatToParts: mockFormatToParts,
          format: vi.fn(),
          resolvedOptions: vi.fn(),
        } as unknown as Intl.DateTimeFormat;
      });

      expect(() => todayJstString()).toThrow('Failed to format JST date');

      Intl.DateTimeFormat = originalDateTimeFormat;
    });
  });
});
