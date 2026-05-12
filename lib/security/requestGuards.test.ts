import { describe, it, expect, vi, afterEach } from 'vitest';
import { requireSameOrigin } from './requestGuards';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, options) => ({ body, ...options })),
    },
  };
});

describe('requireSameOrigin', () => {
  const targetUrl = 'https://example.com/api/test';

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  const createRequest = (headers: Record<string, string>) => {
    return new Request(targetUrl, {
      headers: new Headers(headers),
    });
  };

  it('should return ok:true when origin matches target origin', () => {
    const req = createRequest({ origin: 'https://example.com' });
    const result = requireSameOrigin(req);
    expect(result).toEqual({ ok: true });
  });

  it('should return 403 when origin does not match target origin', () => {
    const req = createRequest({ origin: 'https://malicious.com' });
    const result = requireSameOrigin(req);

    expect(result.ok).toBe(false);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid origin' }, { status: 403 });
  });

  it('should return ok:true when origin is missing but referer matches target origin', () => {
    const req = createRequest({ referer: 'https://example.com/some/path' });
    const result = requireSameOrigin(req);
    expect(result).toEqual({ ok: true });
  });

  it('should return 403 when origin is missing and referer does not match target origin', () => {
    const req = createRequest({ referer: 'https://malicious.com/some/path' });
    const result = requireSameOrigin(req);

    expect(result.ok).toBe(false);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid referer' }, { status: 403 });
  });

  it('should return 403 when origin is missing and referer is invalid URL', () => {
    const req = createRequest({ referer: 'not-a-valid-url' });
    const result = requireSameOrigin(req);

    expect(result.ok).toBe(false);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid referer' }, { status: 403 });
  });

  it('should return ok:true when origin and referer are missing in non-production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = createRequest({});
    const result = requireSameOrigin(req);
    expect(result).toEqual({ ok: true });
  });

  it('should return 403 when origin and referer are missing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = createRequest({});
    const result = requireSameOrigin(req);

    expect(result.ok).toBe(false);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Origin header required' }, { status: 403 });
  });
});
