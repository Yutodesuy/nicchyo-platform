import { describe, expect, it } from "vitest";

import {
  createCouponQrToken,
  verifyAndParseCouponQrToken,
} from "../../../lib/coupons/qrToken";

describe("coupon qr tokens", () => {
  it("creates unique tokens for different coupon issuances", () => {
    const now = Date.UTC(2026, 3, 25, 3, 0, 0);

    const tokenA = createCouponQrToken("visitor-123", "coupon-a", now);
    const tokenB = createCouponQrToken("visitor-123", "coupon-b", now);

    expect(tokenA).not.toBe(tokenB);

    const parsedA = verifyAndParseCouponQrToken(tokenA, now);
    const parsedB = verifyAndParseCouponQrToken(tokenB, now);

    expect(parsedA?.visitorKey).toBe("visitor-123");
    expect(parsedA?.issuanceId).toBe("coupon-a");
    expect(parsedB?.issuanceId).toBe("coupon-b");
  });

  it("rejects tokens when the issuance id is tampered", () => {
    const now = Date.UTC(2026, 3, 25, 3, 0, 0);
    const token = createCouponQrToken("visitor-123", "coupon-a", now);

    const tampered = token.replace("coupon-a", "coupon-b");

    expect(verifyAndParseCouponQrToken(tampered, now)).toBeNull();
  });
});
