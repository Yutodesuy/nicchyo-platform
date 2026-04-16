import { NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
  keySuffix?: string | null;
  message?: string;
};

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();
const MAX_BUCKETS = 20000;

function cleanupIfNeeded() {
  if (RATE_LIMIT_STORE.size <= MAX_BUCKETS) return;
  const oldest = Array.from(RATE_LIMIT_STORE.entries())
    .sort((a, b) => a[1].resetAt - b[1].resetAt)
    .slice(0, 3000);
  oldest.forEach(([key]) => RATE_LIMIT_STORE.delete(key));
}

export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return "unknown";

  return forwardedFor.split(",")[0]?.trim() || "unknown";
}

export function enforceRateLimit(
  request: Request,
  { bucket, limit, windowMs, keySuffix, message }: RateLimitOptions
) {
  const ip = getClientIp(request);
  const key = [bucket, ip, keySuffix ?? ""].join(":");
  const now = Date.now();

  const current = RATE_LIMIT_STORE.get(key);
  if (!current || now > current.resetAt) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    cleanupIfNeeded();
    return null;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: message ?? "リクエストが多すぎます。しばらくしてからお試しください。",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  current.count += 1;
  return null;
}