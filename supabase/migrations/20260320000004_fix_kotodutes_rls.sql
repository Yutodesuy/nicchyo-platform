-- ことづてテーブルの RLS ポリシー追加
-- 管理者・モデレーターはステータスに関係なく全件参照可能

CREATE POLICY "kotodutes_select_admin"
  ON kotodutes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );
