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
  const activeCouponTypeId = data?.active_coupon?.coupon_type_id;
  if (!activeCouponTypeId) {
    return new Set<string>();
  }
  return new Set(
    (data?.participating_vendors ?? [])
      .filter((vendor) => vendor.coupon_type_id === activeCouponTypeId)
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
