-- 出店申請テーブル
-- 一般ユーザーが出店を申請するためのテーブル

CREATE TABLE IF NOT EXISTS vendor_applications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name     text        NOT NULL,
  owner_name    text        NOT NULL,
  email         text        NOT NULL,
  phone         text,
  category_id   uuid        REFERENCES categories(id) ON DELETE SET NULL,
  main_products text[]      NOT NULL DEFAULT '{}',
  message       text,                             -- 申請理由・意気込み
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  review_note   text,                             -- 管理者のコメント
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX vendor_applications_status_idx     ON vendor_applications(status);
CREATE INDEX vendor_applications_created_at_idx ON vendor_applications(created_at DESC);

-- RLS 有効化
ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;

-- 誰でも申請可能
CREATE POLICY "vendor_applications_insert_all"
  ON vendor_applications FOR INSERT
  WITH CHECK (true);

-- 管理者・モデレーターは全件参照可能
CREATE POLICY "vendor_applications_select_admin"
  ON vendor_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- 管理者・モデレーターはステータス変更可能
CREATE POLICY "vendor_applications_update_admin"
  ON vendor_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );
