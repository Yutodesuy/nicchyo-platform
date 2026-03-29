-- ① market_locations: super_admin も管理できるようにポリシーを修正
ALTER POLICY "admin manage market locations"
  ON market_locations
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin')
    )
  );

-- ② vendor_contents: ソフトデリート用の status カラムを追加
ALTER TABLE vendor_contents
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'hidden', 'deleted'));

CREATE INDEX IF NOT EXISTS vendor_contents_status_idx ON vendor_contents(status);

-- ③ 公開用の参照ポリシーを更新（有効期限内 かつ status = 'active' のみ公開）
ALTER POLICY "public can read active contents"
  ON vendor_contents
  USING (expires_at > now() AND status = 'active');
