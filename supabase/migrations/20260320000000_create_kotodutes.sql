-- ことづてテーブル
-- 来場者がお店や市場全体へのメッセージを残す機能

CREATE TABLE IF NOT EXISTS kotodutes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key text        NOT NULL,               -- ブラウザ識別子（匿名ユーザー対応）
  vendor_id   uuid        REFERENCES vendors(id) ON DELETE SET NULL, -- 特定店舗へのことづて（NULL=市場全体）
  body        text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  status      text        NOT NULL DEFAULT 'published'
                          CHECK (status IN ('published', 'hidden', 'deleted')),
  report_count integer    NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX kotodutes_status_idx       ON kotodutes(status);
CREATE INDEX kotodutes_created_at_idx   ON kotodutes(created_at DESC);
CREATE INDEX kotodutes_vendor_id_idx    ON kotodutes(vendor_id);
CREATE INDEX kotodutes_report_count_idx ON kotodutes(report_count DESC);

-- RLS 有効化
ALTER TABLE kotodutes ENABLE ROW LEVEL SECURITY;

-- 誰でも公開中のことづてを読める
CREATE POLICY "kotodutes_select_published"
  ON kotodutes FOR SELECT
  USING (status = 'published');

-- 誰でも投稿可能（visitor_key で識別）
CREATE POLICY "kotodutes_insert_all"
  ON kotodutes FOR INSERT
  WITH CHECK (true);

-- 管理者・モデレーターはステータス変更可能
CREATE POLICY "kotodutes_update_admin"
  ON kotodutes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );
