// ─── クーポン機能 共有型定義 ──────────────────────────────────────────────────

export type MinPurchaseAmount = 0 | 300 | 500 | 1000;
export type IssueReason = "initial" | "next_visit";

/** クーポン種類 */
export interface CouponType {
  id: string;
  name: string;
  description: string;
  emoji: string;
  amount: number;
  is_initial_gift: boolean;
  is_enabled: boolean;
  display_order: number;
}

/** 出店者のクーポン参加設定（1行 = 1種類への参加設定） */
export interface VendorCouponSetting {
  id: string;
  vendor_id: string;
  coupon_type_id: string;
  is_participating: boolean;
  min_purchase_amount: MinPurchaseAmount;
  updated_at: string;
  /** JOIN用 */
  coupon_type?: CouponType;
}

/** 発行済みクーポン */
export interface CouponIssuance {
  id: string;
  visitor_key: string;
  market_date: string;
  coupon_type_id: string;
  amount: number;
  is_used: boolean;
  used_at: string | null;
  used_vendor_id: string | null;
  issue_reason: IssueReason;
  expires_at: string;
  created_at: string;
  /** JOIN用 */
  coupon_type?: CouponType;
}

/** スタンプ */
export interface CouponStamp {
  id: string;
  visitor_key: string;
  vendor_id: string;
  market_date: string;
  created_at: string;
}

/** 利用確定ログ */
export interface CouponRedemptionLog {
  id: string;
  coupon_issuance_id: string;
  visitor_key: string;
  vendor_id: string;
  coupon_type_id: string;
  market_date: string;
  amount_discounted: number;
  is_new_stamp: boolean;
  next_coupon_issued: boolean;
  next_coupon_type_id: string | null;
  confirmed_by: string | null;
  created_at: string;
}

// ─── API レスポンス型 ─────────────────────────────────────────────────────────

/** GET /api/coupons/my のレスポンス */
export interface MyCouponsResponse {
  /** アクティブな（未使用・有効期限内）クーポン。1枚か0枚 */
  active_coupon: (CouponIssuance & { coupon_type: CouponType }) | null;
  /** 当日のスタンプ一覧 */
  stamps: Array<{
    vendor_id: string;
    vendor_name: string;
    stamped_at: string;
  }>;
  /** 参加店一覧（クーポン種類別）*/
  participating_vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    coupon_type_id: string;
    coupon_type_name: string;
    coupon_type_emoji: string;
    min_purchase_amount: MinPurchaseAmount;
    is_stamped: boolean;
  }>;
  /** 今日が開催日かどうか */
  is_market_day: boolean;
}

/** POST /api/coupons/issue-initial のレスポンス */
export interface IssueInitialResponse {
  /** 新規発行されたか（false = 既発行 or スキップ） */
  issued: boolean;
  coupon: (CouponIssuance & { coupon_type: CouponType }) | null;
}

/** POST /api/coupons/redeem のレスポンス */
export interface RedeemResponse {
  success: true;
  amount_discounted: number;
  is_new_stamp: boolean;
  next_coupon_issued: boolean;
  next_coupon: (CouponIssuance & { coupon_type: CouponType }) | null;
}

/** GET /api/vendor/coupon-settings のレスポンス */
export interface VendorCouponSettingsResponse {
  settings: VendorCouponSetting[];
  coupon_types: CouponType[];
}
