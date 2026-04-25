"use client";

import type {
  CouponTypeWithParticipants,
  CouponTypesResponse,
  MyCouponsResponse,
} from "@/lib/coupons/types";
import { todayJstString } from "@/lib/time/jstDate";

export const COUPON_LOTTERY_PENDING_KEY = "nicchyo-coupon-lottery-pending";
export { todayJstString };

export async function fetchMyCoupons(
  visitorKey: string,
  marketDate = todayJstString()
): Promise<MyCouponsResponse | null> {
  const response = await fetch(
    `/api/coupons/my?visitor_key=${encodeURIComponent(visitorKey)}&market_date=${marketDate}`
  );
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as MyCouponsResponse;
}

export async function fetchCouponTypes(): Promise<CouponTypeWithParticipants[]> {
  const response = await fetch("/api/coupons/types");
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as CouponTypesResponse;
  return payload.coupon_types ?? [];
}

export function getEligibleCouponVendorIds(data: MyCouponsResponse | null): Set<string> {
  const activeCoupons = data?.active_coupons ?? (data?.active_coupon ? [data.active_coupon] : []);
  if (activeCoupons.length === 0) {
    return new Set<string>();
  }
  const activeCouponTypeIds = new Set(activeCoupons.map((c) => c.coupon_type_id));
  return new Set(
    (data?.participating_vendors ?? [])
      .filter((vendor) => activeCouponTypeIds.has(vendor.coupon_type_id))
      .map((vendor) => vendor.vendor_id)
  );
}

export function buildCouponVendorIdsByType(
  couponTypes: CouponTypeWithParticipants[]
): Map<string, Set<string>> {
  return new Map(
    couponTypes.map((couponType) => [
      couponType.id,
      new Set(couponType.participants.map((participant) => participant.vendor_id)),
    ])
  );
}
