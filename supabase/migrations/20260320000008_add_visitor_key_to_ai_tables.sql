-- ai_consult_logs に visitor_key を追加（レートリミットの精度向上）
ALTER TABLE ai_consult_logs
  ADD COLUMN IF NOT EXISTS visitor_key text;

CREATE INDEX IF NOT EXISTS idx_ai_consult_logs_visitor_key
  ON ai_consult_logs(visitor_key, created_at DESC);

-- ai_abuse_blocks に visitor_key を追加（visitor_key でのブロックに対応）
ALTER TABLE ai_abuse_blocks
  ADD COLUMN IF NOT EXISTS visitor_key text;

CREATE INDEX IF NOT EXISTS ai_abuse_blocks_visitor_key_idx
  ON ai_abuse_blocks(visitor_key);

-- ai_abuse_events に visitor_key を追加（ログ記録の充実）
ALTER TABLE ai_abuse_events
  ADD COLUMN IF NOT EXISTS visitor_key text;
