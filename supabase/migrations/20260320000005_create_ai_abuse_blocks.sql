-- AI不正利用ブロックテーブル
CREATE TABLE IF NOT EXISTS ai_abuse_blocks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  text        NOT NULL,
  reason      text        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_abuse_blocks_ip_idx       ON ai_abuse_blocks(ip_address);
CREATE INDEX IF NOT EXISTS ai_abuse_blocks_active_idx   ON ai_abuse_blocks(is_active);

-- AI不正利用イベントログ
CREATE TABLE IF NOT EXISTS ai_abuse_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  text,
  event_type  text        NOT NULL,  -- 'sql_injection' | 'prompt_injection' | 'spam' | 'rate_limit'
  message     text,
  severity    integer     NOT NULL DEFAULT 1,  -- 1=低, 2=中, 3=高
  blocked     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_abuse_events_ip_idx       ON ai_abuse_events(ip_address);
CREATE INDEX IF NOT EXISTS ai_abuse_events_created_at_idx ON ai_abuse_events(created_at DESC);

-- RLS 有効化（service role のみ書き込み、管理者は参照可）
ALTER TABLE ai_abuse_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_abuse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_abuse_blocks_select_admin"
  ON ai_abuse_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "ai_abuse_events_select_admin"
  ON ai_abuse_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = auth.uid()
        AND vendors.role IN ('admin', 'super_admin', 'moderator')
    )
  );
