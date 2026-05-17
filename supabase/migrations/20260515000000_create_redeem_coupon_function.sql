-- クーポン換金をアトミックに実行する RPC 関数
--
-- クーポン消費・スタンプ付与・次回クーポン発行を1トランザクション内で完結させ、
-- ロールバック不整合と race condition を解消する。
--
-- 引数:
--   p_coupon_id          : 消費するクーポンの UUID
--   p_visitor_key        : 来場者キー
--   p_vendor_id          : 出店者 UUID
--   p_market_date        : 市場開催日 (YYYY-MM-DD)
--   p_max_issuance       : 当日の発行上限枚数
--   p_next_coupon_amount : 次回クーポンの割引額
--
-- 戻り値 (jsonb):
--   is_new_stamp  : 今回初スタンプかどうか
--   next_coupon   : 発行した次回クーポンの全データ（coupon_types JOIN済み）。発行なしの場合は null。
--                   トランザクション内で SELECT するため、別途フェッチ時のレース条件がない。
CREATE OR REPLACE FUNCTION redeem_coupon(
  p_coupon_id          uuid,
  p_visitor_key        text,
  p_vendor_id          uuid,
  p_market_date        date,
  p_max_issuance       integer,
  p_next_coupon_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated       integer;
  v_is_new_stamp       boolean;
  v_next_type_id       uuid;
  v_today_count        bigint;
  v_new_coupon_id      uuid;
  v_expires_at         timestamptz;
  v_next_coupon        jsonb;
BEGIN
  -- ① クーポン消費（is_used = false を条件にし、二重消費を防ぐ）
  UPDATE coupon_issuances
  SET is_used        = true,
      used_at        = now(),
      used_vendor_id = p_vendor_id
  WHERE id      = p_coupon_id
    AND is_used = false;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated = 0 THEN
    -- 別リクエストが先に消費済み
    RAISE EXCEPTION 'COUPON_ALREADY_USED';
  END IF;

  -- ② 新規スタンプかどうかを確認（INSERT 前に確認する）
  SELECT NOT EXISTS (
    SELECT 1
    FROM coupon_stamps
    WHERE visitor_key = p_visitor_key
      AND vendor_id   = p_vendor_id
      AND market_date = p_market_date
  ) INTO v_is_new_stamp;

  -- ③ スタンプ付与（重複は無視）
  INSERT INTO coupon_stamps (visitor_key, vendor_id, market_date)
  VALUES (p_visitor_key, p_vendor_id, p_market_date)
  ON CONFLICT (visitor_key, vendor_id, market_date) DO NOTHING;

  -- ④ 新規スタンプの場合のみ次回クーポンを発行
  v_new_coupon_id := NULL;
  IF v_is_new_stamp THEN
    -- 当日発行済み枚数を取得（count + insert がトランザクション内で完結するため race condition なし）
    SELECT COUNT(*) INTO v_today_count
    FROM coupon_issuances
    WHERE market_date = p_market_date;

    IF v_today_count < p_max_issuance THEN
      -- 次回クーポン種別をランダム選択（is_initial_gift = false を優先）
      SELECT id INTO v_next_type_id
      FROM coupon_types
      WHERE is_enabled     = true
        AND is_initial_gift = false
      ORDER BY RANDOM()
      LIMIT 1;

      -- is_initial_gift = false が存在しない場合は任意の有効種別から選択
      IF v_next_type_id IS NULL THEN
        SELECT id INTO v_next_type_id
        FROM coupon_types
        WHERE is_enabled = true
        ORDER BY RANDOM()
        LIMIT 1;
      END IF;

      IF v_next_type_id IS NOT NULL THEN
        -- expires_at: market_date 翌日 15:00 UTC（JST 翌々日 0:00）
        v_expires_at := (p_market_date + interval '1 day')::timestamp + interval '15 hours';

        INSERT INTO coupon_issuances (
          visitor_key,
          market_date,
          coupon_type_id,
          amount,
          issue_reason,
          expires_at
        ) VALUES (
          p_visitor_key,
          p_market_date,
          v_next_type_id,
          p_next_coupon_amount,
          'next_visit',
          v_expires_at
        )
        RETURNING id INTO v_new_coupon_id;

        -- 発行した次回クーポンの全データをトランザクション内で取得（coupon_types JOIN込み）
        -- これにより呼び出し側で別途 SELECT する必要がなくなり、フェッチ時のレース条件を排除する
        SELECT jsonb_build_object(
          'id',             ci.id,
          'visitor_key',    ci.visitor_key,
          'market_date',    ci.market_date::text,
          'coupon_type_id', ci.coupon_type_id,
          'amount',         ci.amount,
          'is_used',        ci.is_used,
          'used_at',        ci.used_at,
          'used_vendor_id', ci.used_vendor_id,
          'issue_reason',   ci.issue_reason,
          'expires_at',     ci.expires_at,
          'created_at',     ci.created_at,
          'coupon_types', jsonb_build_object(
            'id',            ct.id,
            'name',          ct.name,
            'description',   ct.description,
            'emoji',         ct.emoji,
            'amount',        ct.amount,
            'is_initial_gift', ct.is_initial_gift,
            'is_enabled',    ct.is_enabled,
            'display_order', ct.display_order
          )
        )
        INTO v_next_coupon
        FROM coupon_issuances ci
        JOIN coupon_types ct ON ct.id = ci.coupon_type_id
        WHERE ci.id = v_new_coupon_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'is_new_stamp', v_is_new_stamp,
    'next_coupon',  v_next_coupon
  );
END;
$$;

-- service_role のみ実行可能。anon・authenticated からは直接呼び出せないようにする。
-- この関数は SECURITY DEFINER のため、権限を明示的に制限することが重要。
GRANT EXECUTE ON FUNCTION redeem_coupon TO service_role;
REVOKE EXECUTE ON FUNCTION redeem_coupon FROM anon, authenticated;
