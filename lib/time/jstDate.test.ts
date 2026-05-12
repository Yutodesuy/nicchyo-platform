import { describe, it, expect, vi, afterEach } from 'vitest';
import { todayJstString } from './jstDate';

describe('todayJstString', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a correctly formatted JST date string', () => {
    // Mock date to "2024-05-12T10:00:00Z"
    const mockDate = new Date('2024-05-12T10:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = todayJstString();

    // 2024-05-12T10:00:00Z is 2024-05-12 19:00:00 JST
    expect(result).toBe('2024-05-12');

    vi.useRealTimers();
  });

  it('should return a correctly formatted JST date string near midnight UTC', () => {
    // Mock date to "2024-05-12T22:00:00Z"
    const mockDate = new Date('2024-05-12T22:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = todayJstString();

    // 2024-05-12T22:00:00Z is 2024-05-13 07:00:00 JST
    expect(result).toBe('2024-05-13');

    vi.useRealTimers();
  });

  it('should throw an error if formatting fails', () => {
    // Spy on Intl.DateTimeFormat.prototype.formatToParts to simulate failure
    const formatToPartsSpy = vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts');
    formatToPartsSpy.mockReturnValue([]); // Return empty parts to trigger the error

    expect(() => todayJstString()).toThrow('Failed to format JST date');
  });
});
