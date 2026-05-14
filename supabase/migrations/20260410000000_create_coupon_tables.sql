-- =====================================================================
-- クーポン機能テーブル群
-- =====================================================================
-- coupon_types          : クーポン種類（食べ歩き・土佐の野菜 etc.）
-- vendor_coupon_settings: 出店者ごとのクーポン参加設定
-- coupon_issuances      : 発行済みクーポン（保有管理）
-- coupon_stamps         : 利用後のスタンプ台帳
-- coupon_redemption_logs: 利用確定の監査ログ
-- =====================================================================

-- ─── coupon_types ─────────────────────────────────────────────────────
CREATE TABLE coupon_types (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,           -- "食べ歩きクーポン" etc.
  description     text        NOT NULL DEFAULT '',
  emoji           text        NOT NULL DEFAULT '🎟️',
  amount          integer     NOT NULL DEFAULT 50  -- 割引額（円）
    CHECK (amount > 0),
  is_initial_gift boolean     NOT NULL DEFAULT false, -- マップ初訪問で配布する種類
  is_enabled      boolean     NOT NULL DEFAULT true,
  display_order   integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 公開閲覧のみ可
ALTER TABLE coupon_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_types_public_select"
  ON coupon_types FOR SELECT USING (true);
CREATE POLICY "coupon_types_admin_all"
  ON coupon_types FOR ALL
  USING (
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role'
    ) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role'
    ) IN ('admin', 'super_admin')
  );

-- ─── vendor_coupon_settings ───────────────────────────────────────────
-- 出店者は複数のクーポン種類に参加できる（vendor_id + coupon_type_id でユニーク）
CREATE TABLE vendor_coupon_settings (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  coupon_type_id      uuid        NOT NULL REFERENCES coupon_types(id) ON DELETE CASCADE,
  is_participating    boolean     NOT NULL DEFAULT false,
  min_purchase_amount integer     NOT NULL DEFAULT 0
    CHECK (min_purchase_amount IN (0, 300, 500, 1000)),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, coupon_type_id)
);

CREATE INDEX idx_vcs_vendor_id         ON vendor_coupon_settings(vendor_id);
CREATE INDEX idx_vcs_coupon_type_id    ON vendor_coupon_settings(coupon_type_id);
CREATE INDEX idx_vcs_participating     ON vendor_coupon_settings(coupon_type_id, is_participating)
  WHERE is_participating = true;

ALTER TABLE vendor_coupon_settings ENABLE ROW LEVEL SECURITY;

-- 参加フラグ・条件は公開（マップ・バナーで表示するため）
CREATE POLICY "vcs_public_select"
  ON vendor_coupon_settings FOR SELECT USING (true);

-- 出店者本人のみ更新可
CREATE POLICY "vcs_vendor_insert"
  ON vendor_coupon_settings FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "vcs_vendor_update"
  ON vendor_coupon_settings FOR UPDATE
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "vcs_vendor_delete"
  ON vendor_coupon_settings FOR DELETE
  USING (auth.uid() = vendor_id);

-- ─── coupon_issuances ─────────────────────────────────────────────────
-- visitor_keyが保有するクーポン。1visitor_key+market_dateで最大1枚のアクティブ券
CREATE TABLE coupon_issuances (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key     text        NOT NULL,
  market_date     date        NOT NULL,
  coupon_type_id  uuid        NOT NULL REFERENCES coupon_types(id),
  amount          integer     NOT NULL DEFAULT 50,
  is_used         boolean     NOT NULL DEFAULT false,
  used_at         timestamptz,
  used_vendor_id  uuid        REFERENCES vendors(id) ON DELETE SET NULL,
  issue_reason    text        NOT NULL DEFAULT 'initial'  -- 'initial' | 'next_visit'
    CHECK (issue_reason IN ('initial', 'next_visit')),
  expires_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 1 visitor_key + market_date での initial 発行は1件のみ
CREATE UNIQUE INDEX uq_coupon_issuances_initial
  ON coupon_issuances(visitor_key, market_date)
  WHERE issue_reason = 'initial';

CREATE INDEX idx_ci_visitor_market
  ON coupon_issuances(visitor_key, market_date, is_used);
CREATE INDEX idx_ci_expires_at
  ON coupon_issuances(expires_at);
CREATE INDEX idx_ci_used_vendor
  ON coupon_issuances(used_vendor_id, market_date);

-- service role 経由でのみ操作（visitor_key はJWT外なのでRLSで直接制御しない）
ALTER TABLE coupon_issuances ENABLE ROW LEVEL SECURITY;
-- RLSポリシーなし → anon/authenticated からは直接アクセス不可
-- APIルートハンドラ(service role client)からのみ操作する

-- ─── coupon_stamps ────────────────────────────────────────────────────
-- クーポン利用後のスタンプ台帳
CREATE TABLE coupon_stamps (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key text        NOT NULL,
  vendor_id   uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  market_date date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visitor_key, vendor_id, market_date)
);

CREATE INDEX idx_cs_visitor_market ON coupon_stamps(visitor_key, market_date);

ALTER TABLE coupon_stamps ENABLE ROW LEVEL SECURITY;
-- service role 経由でのみ操作

-- ─── coupon_redemption_logs ───────────────────────────────────────────
-- 利用確定の監査ログ（削除不可、追記のみ）
CREATE TABLE coupon_redemption_logs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_issuance_id  uuid        NOT NULL REFERENCES coupon_issuances(id),
  visitor_key         text        NOT NULL,
  vendor_id           uuid        NOT NULL REFERENCES vendors(id),
  coupon_type_id      uuid        NOT NULL REFERENCES coupon_types(id),
  market_date         date        NOT NULL,
  amount_discounted   integer     NOT NULL DEFAULT 50,
  is_new_stamp        boolean     NOT NULL DEFAULT false,
  next_coupon_issued  boolean     NOT NULL DEFAULT false,
  next_coupon_type_id uuid        REFERENCES coupon_types(id),
  confirmed_by        uuid        REFERENCES vendors(id),
  ip_address          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crl_market_date   ON coupon_redemption_logs(market_date);
CREATE INDEX idx_crl_vendor_market ON coupon_redemption_logs(vendor_id, market_date);
CREATE INDEX idx_crl_visitor_key   ON coupon_redemption_logs(visitor_key, market_date);

ALTER TABLE coupon_redemption_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crl_admin_select"
  ON coupon_redemption_logs FOR SELECT
  USING (
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role'
    ) IN ('admin', 'super_admin')
  );
-- INSERT は service role のみ（ポリシーなし）

-- ─── system_settings に coupon キーを追加 ────────────────────────────
INSERT INTO system_settings (key, value)
VALUES (
  'coupon',
  jsonb_build_object(
    'enabled',          false,
    'amount',           50,
    'maxDailyIssuance', 300
  )
)
ON CONFLICT (key) DO NOTHING;

-- ─── 初期データ: クーポン種類 ─────────────────────────────────────────
INSERT INTO coupon_types (name, description, emoji, amount, is_initial_gift, is_enabled, display_order)
VALUES
  (
    '食べ歩きクーポン',
    '日曜市の食べ物・飲み物のお店で使えるクーポンです。',
    '🍡',
    50,
    true,   -- 初回配布はこれ
    true,
    1
  ),
  (
    '土佐の野菜クーポン',
    '高知県産の野菜・果物を取り扱うお店で使えるクーポンです。',
    '🥬',
    50,
    false,
    true,
    2
  ),
  (
    '工芸・クラフトクーポン',
    '手工芸品・クラフト作品を取り扱うお店で使えるクーポンです。',
    '🎨',
    50,
    false,
    true,
    3
  );
