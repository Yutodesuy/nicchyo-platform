import { createHmac, timingSafeEqual } from "crypto";

export const COUPON_QR_SLOT_MS = 300_000;
const COUPON_QR_GRACE_SLOTS = 1;

type ParsedCouponQrToken = {
  visitorKey: string;
  slot: number;
  signature: string;
};

function getCouponQrSecret(): string {
  const secret =
    process.env.COUPON_QR_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Coupon QR secret missing");
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
  const provided = Buffer.from(parsed.signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return false;
  }

  const currentSlot = getCurrentCouponQrSlot(now);
  return parsed.slot <= currentSlot && parsed.slot >= currentSlot - COUPON_QR_GRACE_SLOTS;
}
