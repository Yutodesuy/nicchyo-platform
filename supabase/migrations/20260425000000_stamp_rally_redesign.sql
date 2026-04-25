-- =====================================================================
-- スタンプラリー型クーポンシステムへのリデザイン
-- =====================================================================

-- 1. coupon_types にマイルストーン列を追加
ALTER TABLE coupon_types
  ADD COLUMN IF NOT EXISTS milestone_stamp_count integer;

-- 2. coupon_issuances の issue_reason CHECK制約を更新（milestone_1/3/5 を許可）
ALTER TABLE coupon_issuances DROP CONSTRAINT IF EXISTS coupon_issuances_issue_reason_check;
ALTER TABLE coupon_issuances ADD CONSTRAINT coupon_issuances_issue_reason_check
  CHECK (issue_reason IN ('initial', 'next_visit', 'milestone_1', 'milestone_3', 'milestone_5'));

-- 3. coupon_redemption_logs.coupon_issuance_id をNULL許容に
--    （クーポン未保有のスタンプのみスキャン時は参照するクーポンIDがない）
ALTER TABLE coupon_redemption_logs ALTER COLUMN coupon_issuance_id DROP NOT NULL;

-- 4. coupon_redemption_logs.coupon_type_id をNULL許容に
--    （同上、スタンプのみスキャン時はクーポン種別なし）
ALTER TABLE coupon_redemption_logs ALTER COLUMN coupon_type_id DROP NOT NULL;

-- 5. スキャン時にクーポンを保有していたかを記録するカラムを追加
ALTER TABLE coupon_redemption_logs
  ADD COLUMN IF NOT EXISTS had_coupon boolean NOT NULL DEFAULT true;

-- 6. マイルストーン用クーポン種別を追加
INSERT INTO coupon_types (name, emoji, description, amount, is_initial_gift, is_enabled, display_order, milestone_stamp_count)
VALUES
  ('スタンプ1回達成', '🎁', '1店舗来店ありがとう！', 100, false, true, 10, 1),
  ('スタンプ3回達成', '🎉', '3店舗制覇！中盤ご褒美', 200, false, true, 11, 3),
  ('スタンプ5回達成', '🏆', '5店舗のツワモノ！最大ご褒美', 300, false, true, 12, 5)
ON CONFLICT DO NOTHING;

-- 7. 同じ日・同じマイルストーンの二重発行を防止
CREATE UNIQUE INDEX IF NOT EXISTS uq_coupon_issuances_milestone
  ON coupon_issuances(visitor_key, market_date, issue_reason)
  WHERE issue_reason LIKE 'milestone_%';
