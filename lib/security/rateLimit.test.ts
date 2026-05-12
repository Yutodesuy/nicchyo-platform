import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getClientIp, enforceRateLimit } from './rateLimit';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, options) => ({ body, ...options })),
    },
  };
});

describe('getClientIp', () => {
  it('should extract IP from x-real-ip header', () => {
    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-real-ip': '1.2.3.4' }),
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('should extract first IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-forwarded-for': '1.2.3.5, 8.8.8.8' }),
    });
    expect(getClientIp(req)).toBe('1.2.3.5');
  });

  it('should return unknown if no IP headers are present', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('enforceRateLimit', () => {
  const defaultOptions = {
    bucket: 'test-bucket',
    limit: 2,
    windowMs: 1000,
  };

  const createReq = (ip: string) =>
    new Request('http://localhost', {
      headers: new Headers({ 'x-real-ip': ip }),
    });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should allow requests under the limit', () => {
    const req = createReq('10.0.0.1');

    // First request
    const result1 = enforceRateLimit(req, defaultOptions);
    expect(result1).toBeNull();

    // Second request
    const result2 = enforceRateLimit(req, defaultOptions);
    expect(result2).toBeNull();
  });

  it('should block requests over the limit and return 429 response', () => {
    const req = createReq('10.0.0.2');

    // First and second requests (allowed)
    enforceRateLimit(req, defaultOptions);
    enforceRateLimit(req, defaultOptions);

    // Third request (blocked)
    const result = enforceRateLimit(req, defaultOptions);

    expect(result).not.toBeNull();
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        error: 'Too Many Requests',
        message: 'リクエストが多すぎます。しばらくしてからお試しください。',
      },
      expect.objectContaining({ status: 429 })
    );
  });

  it('should reset limit after windowMs has passed', () => {
    const req = createReq('10.0.0.3');

    // First and second requests (allowed)
    enforceRateLimit(req, defaultOptions);
    enforceRateLimit(req, defaultOptions);

    // Third request (blocked)
    expect(enforceRateLimit(req, defaultOptions)).not.toBeNull();

    // Advance time past the window
    vi.advanceTimersByTime(1500);

    // Fourth request (allowed again)
    const result = enforceRateLimit(req, defaultOptions);
    expect(result).toBeNull();
  });

  it('should use custom message and keySuffix when provided', () => {
    const req = createReq('10.0.0.4');
    const customOptions = {
      ...defaultOptions,
      limit: 1,
      keySuffix: 'custom-suffix',
      message: 'Custom rate limit message',
    };

    // First request (allowed)
    enforceRateLimit(req, customOptions);

    // Second request (blocked)
    const result = enforceRateLimit(req, customOptions);

    expect(result).not.toBeNull();
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Custom rate limit message' }),
      expect.any(Object)
    );
  });
});
