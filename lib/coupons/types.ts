// ─── クーポン機能 共有型定義 ──────────────────────────────────────────────────

export type MinPurchaseAmount = 0 | 300 | 500 | 1000;
export type IssueReason = "initial" | "next_visit" | "milestone_1" | "milestone_3" | "milestone_5";

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
  milestone_stamp_count: number | null;
}

export interface CouponTypeParticipant {
  vendor_id: string;
  vendor_name: string;
  min_purchase_amount: MinPurchaseAmount;
}

export interface CouponTypeWithParticipants extends CouponType {
  participants: CouponTypeParticipant[];
  participant_count: number;
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
  coupon_issuance_id: string | null;
  visitor_key: string;
  vendor_id: string;
  coupon_type_id: string | null;
  market_date: string;
  amount_discounted: number;
  had_coupon: boolean;
  is_new_stamp: boolean;
  next_coupon_issued: boolean;
  next_coupon_type_id: string | null;
  confirmed_by: string | null;
  created_at: string;
}

// ─── API レスポンス型 ─────────────────────────────────────────────────────────

/** GET /api/coupons/my のレスポンス */
export interface MyCouponsResponse {
  /** 後方互換: active_coupons[0] と同じ（null の場合あり） */
  active_coupon: (CouponIssuance & { coupon_type: CouponType }) | null;
  /** アクティブな（未使用・有効期限内）クーポン一覧 */
  active_coupons: Array<CouponIssuance & { coupon_type: CouponType }>;
  /** 当日スタンプ数 */
  stamp_count: number;
  /** 次のマイルストーン（null = 5スタンプ以上でマイルストーンなし） */
  next_milestone: 1 | 3 | 5 | null;
  /** 次マイルストーンまで残りスタンプ数 */
  stamps_to_next: number;
  /** 本日達成済みマイルストーン */
  claimed_milestones: number[];
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
    coupon_type_amount: number;
    min_purchase_amount: MinPurchaseAmount;
    is_stamped: boolean;
  }>;
  /** 今日が開催日かどうか */
  is_market_day: boolean;
}

export interface CouponQrTokenResponse {
  token: string;
  expires_in_seconds: number;
}

export interface CouponQrTokenItem {
  coupon_issuance_id: string;
  token: string;
}

export interface CouponQrTokensResponse {
  tokens: CouponQrTokenItem[];
  expires_in_seconds: number;
}

export interface CouponTypesResponse {
  coupon_types: CouponTypeWithParticipants[];
}

/** POST /api/coupons/issue-initial のレスポンス */
export interface IssueInitialResponse {
  /** 新規発行されたか（false = 既発行 or スキップ） */
  issued: boolean;
  coupon: (CouponIssuance & { coupon_type: CouponType }) | null;
}

/**
 * Supabase の coupon_issuances JOIN 結果の生データ型。
 * `.select("*, coupon_types(*)")` で取得すると `coupon_types` (plural) として返される。
 */
export interface SupabaseCouponIssuanceRow extends Omit<CouponIssuance, "coupon_type"> {
  coupon_types: CouponType | null;
}

/**
 * Supabase JOIN 結果を正規化する。
 * `coupon_types` (plural) → `coupon_type` (singular) に変換し、型安全に扱えるようにする。
 */
export function normalizeCouponIssuance(
  raw: SupabaseCouponIssuanceRow
): Omit<CouponIssuance, "coupon_type"> & { coupon_type: CouponType | null } {
  const { coupon_types, ...rest } = raw;
  return { ...rest, coupon_type: coupon_types ?? null };
}

/** POST /api/coupons/redeem のレスポンス */
export interface RedeemResponse {
  success: true;
  /** 割引額（クーポン未保有時は 0） */
  amount_discounted: number;
  /** スキャン時にクーポンを保有していたか */
  had_coupon: boolean;
  is_new_stamp: boolean;
  /** 本日の累計スタンプ数 */
  total_stamps: number;
  /** 達成したマイルストーン（1, 3, 5 or null） */
  milestone_reached: number | null;
  /** マイルストーンクーポンが発行されたか */
  milestone_coupon_issued: boolean;
  /** 発行されたマイルストーンクーポン */
  milestone_coupon: (CouponIssuance & { coupon_type: CouponType }) | null;
}

/** GET /api/vendor/coupon-settings のレスポンス */
export interface VendorCouponSettingsResponse {
  settings: VendorCouponSetting[];
  coupon_types: CouponType[];
}
