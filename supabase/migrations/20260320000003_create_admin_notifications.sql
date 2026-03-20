-- 管理者通知テーブル
-- 出店申請・ことづて報告・システムイベントなどの通知

CREATE TABLE IF NOT EXISTS admin_notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL,   -- 'new_application' | 'kotodute_reported' | 'system' など
  title       text        NOT NULL,
  body        text,
  link        text,                   -- 通知に関連するページのパス
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX admin_notifications_is_read_idx  ON admin_notifications(is_read);
CREATE INDEX admin_notifications_created_at_idx ON admin_notifications(created_at DESC);

-- RLS 有効化
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- 管理者・モデレーターのみ参照可能
CREATE POLICY "admin_notifications_select_admin"
  ON admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- 管理者・モデレーターのみ更新可能（既読処理）
CREATE POLICY "admin_notifications_update_admin"
  ON admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- 出店申請が追加されたら自動通知
CREATE OR REPLACE FUNCTION notify_new_vendor_application()
RETURNS trigger AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, body, link)
  VALUES (
    'new_application',
    '新しい出店申請があります',
    NEW.shop_name || '（' || NEW.owner_name || '）',
    '/admin/applications'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER vendor_applications_notify_trigger
  AFTER INSERT ON vendor_applications
  FOR EACH ROW EXECUTE FUNCTION notify_new_vendor_application();

-- ことづてが通報されたら自動通知（report_countが1になった時）
CREATE OR REPLACE FUNCTION notify_kotodute_reported()
RETURNS trigger AS $$
BEGIN
  IF NEW.report_count >= 1 AND OLD.report_count = 0 THEN
    INSERT INTO admin_notifications (type, title, body, link)
    VALUES (
      'kotodute_reported',
      'ことづてが報告されました',
      LEFT(NEW.body, 50) || CASE WHEN char_length(NEW.body) > 50 THEN '...' ELSE '' END,
      '/admin/kotodute'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER kotodutes_report_notify_trigger
  AFTER UPDATE ON kotodutes
  FOR EACH ROW EXECUTE FUNCTION notify_kotodute_reported();
