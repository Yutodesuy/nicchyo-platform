import { createHmac, timingSafeEqual } from "crypto";

export const COUPON_QR_SLOT_MS = 300_000;
const COUPON_QR_GRACE_SLOTS = 1;

type ParsedCouponQrToken = {
  visitorKey: string;
  slot: number;
  signature: string;
};

function getCouponQrSecret(): string {
  const secret = process.env.COUPON_QR_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      // 開発環境のみフォールバック（本番では必ず COUPON_QR_SECRET を設定すること）
      return "dev-coupon-qr-secret-not-for-production";
    }
    throw new Error("COUPON_QR_SECRET environment variable is required");
  }
  return secret;
}

export function getCurrentCouponQrSlot(now = Date.now()): number {
  return Math.floor(now / COUPON_QR_SLOT_MS);
}

export function getSecondsUntilNextCouponQrSlot(now = Date.now()): number {
  const nextSlotAt = (getCurrentCouponQrSlot(now) + 1) * COUPON_QR_SLOT_MS;
  return Math.max(1, Math.ceil((nextSlotAt - now) / 1000));
}

function signCouponQrPayload(visitorKey: string, slot: number): string {
  return createHmac("sha256", getCouponQrSecret())
    .update(`${visitorKey}:${slot}`)
    .digest("base64url");
}

export function createCouponQrToken(visitorKey: string, now = Date.now()): string {
  const slot = getCurrentCouponQrSlot(now);
  const signature = signCouponQrPayload(visitorKey, slot);
  return `${visitorKey}:${slot}:${signature}`;
}

export function parseCouponQrToken(token: string): ParsedCouponQrToken | null {
  const parts = token.trim().split(":");
  if (parts.length !== 3) {
    return null;
  }
  const [visitorKey, slotRaw, signature] = parts;
  const slot = Number(slotRaw);
  if (!visitorKey || !signature || !Number.isInteger(slot)) {
    return null;
  }
  return { visitorKey, slot, signature };
}

export function isCouponQrTokenValid(token: string, now = Date.now()): boolean {
  const parsed = parseCouponQrToken(token);
  if (!parsed) {
    return false;
  }

  const expectedSignature = signCouponQrPayload(parsed.visitorKey, parsed.slot);
  let provided: Buffer;
  let expected: Buffer;
  try {
    provided = Buffer.from(parsed.signature, "base64url");
    expected = Buffer.from(expectedSignature, "base64url");
  } catch {
    return false;
  }

  if (provided.length === 0 || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return false;
  }

  const currentSlot = getCurrentCouponQrSlot(now);
  return parsed.slot <= currentSlot && parsed.slot >= currentSlot - COUPON_QR_GRACE_SLOTS;
}
