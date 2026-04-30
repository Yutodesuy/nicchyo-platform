-- =====================================================================
-- 2026-04-14: 週次セキュリティレポート関連テーブル
-- security_reports  : 生成済みHTMLレポートの保存
-- report_readers    : レポート閲覧権限のメールホワイトリスト
-- =====================================================================

-- ─── security_reports ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date  date    NOT NULL UNIQUE,          -- レポート生成日（週の終わり）
  week_start   date    NOT NULL,                 -- 集計期間開始
  week_end     date    NOT NULL,                 -- 集計期間終了
  html_content text    NOT NULL,                 -- 完全なHTMLレポート
  summary      text    NOT NULL DEFAULT '',      -- AI生成サマリー
  risk_level   text    NOT NULL DEFAULT 'low'
                       CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  anomaly_count        integer NOT NULL DEFAULT 0,
  total_page_visits    integer NOT NULL DEFAULT 0,
  total_visitors       integer NOT NULL DEFAULT 0,
  total_coupon_actions integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sr_report_date ON security_reports(report_date DESC);

ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;
-- 読み取りは service_role キー経由のサーバー処理のみ。公開ポリシーなし。


-- ─── report_readers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_readers (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email    text NOT NULL UNIQUE,
  note     text,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE report_readers ENABLE ROW LEVEL SECURITY;
-- 読み取りは service_role キー経由のサーバー処理のみ。公開ポリシーなし。

-- =====================================================================
-- Notes:
-- - security_reports の html_content は自己完結したHTMLを想定。
-- - report_readers への追加はSupabaseダッシュボードまたは管理スクリプトで行う。
-- - どちらのテーブルも RLS が有効で、クライアントからは直接読み書き不可。
-- =====================================================================
