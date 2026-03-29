-- 管理者監査ログテーブル
-- 管理者・モデレーターの操作履歴を記録

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          bigserial   PRIMARY KEY,
  actor_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role  text,
  action      text        NOT NULL,
  target_type text,
  target_id   text,
  target_name text,
  details     text,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX admin_audit_logs_created_at_idx ON admin_audit_logs(created_at DESC);
CREATE INDEX admin_audit_logs_actor_id_idx   ON admin_audit_logs(actor_id);
CREATE INDEX admin_audit_logs_action_idx     ON admin_audit_logs(action);

-- RLS 有効化
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- super_admin・admin のみ参照可能
CREATE POLICY "audit_logs_select_admin"
  ON admin_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin')
    )
  );

-- service role のみ INSERT（API経由で書き込む）
-- RLS では INSERT ポリシーなし → service role client でのみ書き込み可能
