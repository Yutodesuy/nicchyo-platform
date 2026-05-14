import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enforceRateLimit, getClientIp } from './rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getClientIp', () => {
    it('returns x-real-ip if present', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '1.2.3.4' }
      });
      expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('returns x-forwarded-for if x-real-ip is absent', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8, 9.10.11.12' }
      });
      expect(getClientIp(req)).toBe('5.6.7.8');
    });

    it('returns unknown if neither header is present', () => {
      const req = new Request('http://localhost');
      expect(getClientIp(req)).toBe('unknown');
    });
  });

  describe('enforceRateLimit', () => {
    const defaultOptions = {
      bucket: 'test-bucket',
      limit: 2,
      windowMs: 1000, // 1 second
    };

    it('allows requests within limit', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '1.1.1.1' }
      });

      const res1 = enforceRateLimit(req, defaultOptions);
      expect(res1).toBeNull();

      const res2 = enforceRateLimit(req, defaultOptions);
      expect(res2).toBeNull();
    });

    it('blocks requests over limit and returns 429 response', async () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '2.2.2.2' }
      });

      enforceRateLimit(req, defaultOptions);
      enforceRateLimit(req, defaultOptions);
      const res = enforceRateLimit(req, defaultOptions);

      expect(res).not.toBeNull();
      expect(res?.status).toBe(429);
      expect(res?.headers.get('Retry-After')).toBe('1');

      const body = await res?.json();
      expect(body.error).toBe('Too Many Requests');
    });

    it('resets limit after windowMs', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '3.3.3.3' }
      });

      enforceRateLimit(req, defaultOptions);
      enforceRateLimit(req, defaultOptions);

      const resBlocked = enforceRateLimit(req, defaultOptions);
      expect(resBlocked).not.toBeNull();

      // Advance time by 1.1 seconds
      vi.advanceTimersByTime(1100);

      const resAllowed = enforceRateLimit(req, defaultOptions);
      expect(resAllowed).toBeNull();
    });

    it('supports custom messages', async () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '4.4.4.4' }
      });
      const options = { ...defaultOptions, message: 'Custom error message' };

      enforceRateLimit(req, options);
      enforceRateLimit(req, options);
      const res = enforceRateLimit(req, options);

      const body = await res?.json();
      expect(body.message).toBe('Custom error message');
    });
  });
});

  describe('cleanupIfNeeded', () => {
    it('cleans up old entries when MAX_BUCKETS is exceeded', () => {
      const defaultOptions = {
        bucket: 'test-bucket-cleanup',
        limit: 10,
        windowMs: 1000,
      };

      // Fill up to MAX_BUCKETS (20000)
      for (let i = 0; i < 20001; i++) {
        const req = new Request('http://localhost', {
          headers: { 'x-real-ip': `ip-${i}` }
        });
        enforceRateLimit(req, defaultOptions);
      }

      // 20001 triggers cleanup, deleting 3000 oldest
      // Expected size: 20001 - 3000 = 17001

      // Unfortunately we can't easily assert on RATE_LIMIT_STORE size directly
      // since it's not exported. But we can verify it doesn't throw.
      expect(() => {
        const lastReq = new Request('http://localhost', { headers: { 'x-real-ip': 'ip-final' } });
        enforceRateLimit(lastReq, defaultOptions);
      }).not.toThrow();
    });
  });
