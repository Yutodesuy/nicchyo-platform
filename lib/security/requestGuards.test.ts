import { describe, it, expect, vi } from 'vitest';
import { requireSameOrigin } from './requestGuards';

describe('requestGuards', () => {
  describe('requireSameOrigin', () => {
    it('returns ok when origin matches target origin', () => {
      const req = new Request('https://example.com/api', {
        headers: { origin: 'https://example.com' }
      });
      const result = requireSameOrigin(req);
      expect(result.ok).toBe(true);
    });

    it('returns error when origin does not match target origin', async () => {
      const req = new Request('https://example.com/api', {
        headers: { origin: 'https://evil.com' }
      });
      const result = requireSameOrigin(req);
      expect(result.ok).toBe(false);

      if (!result.ok) {
        expect(result.response.status).toBe(403);
        const body = await result.response.json();
        expect(body.error).toBe('Invalid origin');
      }
    });

    it('returns ok when referer matches target origin (no origin provided)', () => {
      const req = new Request('https://example.com/api', {
        headers: { referer: 'https://example.com/page' }
      });
      const result = requireSameOrigin(req);
      expect(result.ok).toBe(true);
    });

    it('returns error when referer does not match target origin (no origin provided)', async () => {
      const req = new Request('https://example.com/api', {
        headers: { referer: 'https://evil.com/page' }
      });
      const result = requireSameOrigin(req);
      expect(result.ok).toBe(false);

      if (!result.ok) {
        expect(result.response.status).toBe(403);
        const body = await result.response.json();
        expect(body.error).toBe('Invalid referer');
      }
    });

    it('returns error when referer URL is invalid', async () => {
      const req = new Request('https://example.com/api', {
        headers: { referer: 'not-a-url' }
      });
      const result = requireSameOrigin(req);
      expect(result.ok).toBe(false);

      if (!result.ok) {
        expect(result.response.status).toBe(403);
        const body = await result.response.json();
        expect(body.error).toBe('Invalid referer');
      }
    });

    it('returns ok when both origin and referer are missing in non-production', () => {
      vi.stubEnv('NODE_ENV', 'development');

      const req = new Request('https://example.com/api');
      const result = requireSameOrigin(req);
      expect(result.ok).toBe(true);

      vi.unstubAllEnvs();
    });

    it('returns error when both origin and referer are missing in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const req = new Request('https://example.com/api');
      const result = requireSameOrigin(req);
      expect(result.ok).toBe(false);

      if (!result.ok) {
        expect(result.response.status).toBe(403);
        const body = await result.response.json();
        expect(body.error).toBe('Origin header required');
      }

      vi.unstubAllEnvs();
    });
  });
});
