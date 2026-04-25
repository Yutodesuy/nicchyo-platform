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

/**
 * トークンを分割する。
 * visitor_key 自体がコロンを含む場合でも正しく動作するよう、
 * 末尾2つのコロン区切りを signature・slot として取り出す。
 */
function parseCouponQrToken(token: string): ParsedCouponQrToken | null {
  const trimmed = token.trim();
  const lastColon = trimmed.lastIndexOf(":");
  if (lastColon < 0) return null;
  const secondLastColon = trimmed.lastIndexOf(":", lastColon - 1);
  if (secondLastColon < 0) return null;

  const visitorKey = trimmed.slice(0, secondLastColon);
  const slotRaw = trimmed.slice(secondLastColon + 1, lastColon);
  const signature = trimmed.slice(lastColon + 1);

  const slot = Number(slotRaw);
  if (!visitorKey || !signature || !Number.isInteger(slot) || slot < 0) {
    return null;
  }
  // signature は base64url 文字のみ許可
  if (!/^[A-Za-z0-9_=-]+$/.test(signature)) {
    return null;
  }
  return { visitorKey, slot, signature };
}

/**
 * トークンの署名検証・有効期限チェックを行い、検証済みの parsed 結果を返す。
 * 無効な場合は null を返す。
 *
 * parseCouponQrToken / isCouponQrTokenValid を個別に呼ぶと
 * 「署名未検証のパース結果」が存在してしまうため、この関数に統合した。
 */
export function verifyAndParseCouponQrToken(
  token: string,
  now = Date.now()
): ParsedCouponQrToken | null {
  const parsed = parseCouponQrToken(token);
  if (!parsed) return null;

  const expectedSignature = signCouponQrPayload(parsed.visitorKey, parsed.slot);
  let provided: Buffer;
  let expected: Buffer;
  try {
    provided = Buffer.from(parsed.signature, "base64url");
    expected = Buffer.from(expectedSignature, "base64url");
  } catch {
    return null;
  }

  if (
    provided.length === 0 ||
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  const currentSlot = getCurrentCouponQrSlot(now);
  if (parsed.slot > currentSlot || parsed.slot < currentSlot - COUPON_QR_GRACE_SLOTS) {
    return null;
  }

  return parsed;
}
