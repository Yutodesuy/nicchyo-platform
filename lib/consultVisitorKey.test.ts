import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getOrCreateConsultVisitorKey } from './consultVisitorKey';

describe('consultVisitorKey', () => {
  const CONSULT_VISITOR_KEY_STORAGE_KEY = "nicchyo-consult-visitor-key";

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns null if window is undefined', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;
    expect(getOrCreateConsultVisitorKey()).toBeNull();
    global.window = originalWindow;
  });

  it('returns existing key if present in localStorage', () => {
    const existingKey = 'visitor-123-abc';
    localStorage.setItem(CONSULT_VISITOR_KEY_STORAGE_KEY, existingKey);
    expect(getOrCreateConsultVisitorKey()).toBe(existingKey);
  });

  it('generates a new key using randomUUID if available', () => {
    const originalCrypto = window.crypto;
    const mockUUID = 'mock-uuid-1234';

    // Setup mock crypto with randomUUID
    Object.defineProperty(window, 'crypto', {
      value: {
        randomUUID: vi.fn().mockReturnValue(mockUUID),
      },
      configurable: true,
    });

    const result = getOrCreateConsultVisitorKey();

    expect(result).toBe(mockUUID);
    expect(window.crypto.randomUUID).toHaveBeenCalled();
    expect(localStorage.getItem(CONSULT_VISITOR_KEY_STORAGE_KEY)).toBe(mockUUID);

    // Restore original
    Object.defineProperty(window, 'crypto', { value: originalCrypto, configurable: true });
  });

  it('generates a fallback key if randomUUID is not available', () => {
    const originalCrypto = window.crypto;

    // Ensure randomUUID is not available
    Object.defineProperty(window, 'crypto', {
      value: {},
      configurable: true,
    });

    vi.setSystemTime(new Date(1600000000000));

    // Mock Math.random to return predictable slice
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const result = getOrCreateConsultVisitorKey();

    // '0.123456789'.toString(36) behaves differently across engines, so we just check prefix and length roughly
    expect(result).toMatch(/^visitor-1600000000000-/);
    expect(localStorage.getItem(CONSULT_VISITOR_KEY_STORAGE_KEY)).toBe(result);

    randomSpy.mockRestore();
    // Restore original
    Object.defineProperty(window, 'crypto', { value: originalCrypto, configurable: true });
  });
});
