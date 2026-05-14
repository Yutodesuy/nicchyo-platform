export type AnalyticsEventName =
  | "page_view"
  | "shop_impression"
  | "shop_view"
  | "shop_scroll"
  | "add_to_bag"
  | "coupon_impression"
  | "coupon_click"
  | "coupon_apply"
  | "coupon_redeem";

export type VisitorKey = string;

export interface PageViewParams {
  page_path: string;
  page_location?: string;
  page_title?: string;
}

export interface ShopImpressionParams {
  shop_id: string;
  shop_name?: string;
  list_position?: number;
  context?: string;
}

export interface ShopViewParams {
  shop_id: string;
  source?: string;
  interaction_method?: string;
}

export interface ShopScrollParams {
  shop_id: string;
  scroll_area: string;
  scroll_depth: number; // 0..100
  viewport_time?: number;
}

export interface CouponImpressionParams {
  coupon_id: string;
  shop_id?: string;
  source: string;
  placement?: string;
  visible_duration?: number;
}

export interface CouponRedeemParams {
  coupon_id: string;
  shop_id?: string;
  source?: string;
  method?: string;
  value?: number;
  currency?: string;
  success?: boolean;
  items_count?: number;
}

export type AnalyticsParams =
  | PageViewParams
  | ShopImpressionParams
  | ShopViewParams
  | ShopScrollParams
  | CouponImpressionParams
  | CouponRedeemParams
  | Record<string, unknown>;

export interface SendEventOptions {
  toServer?: boolean; // whether to POST to server endpoints for reliable logging
}

export type SendEventFn = (name: AnalyticsEventName, params: AnalyticsParams, options?: SendEventOptions) => void;
