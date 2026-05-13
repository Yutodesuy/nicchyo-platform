-- ai_consult_logs に IP アドレスカラムを追加（レートリミット用）
ALTER TABLE ai_consult_logs
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_ai_consult_logs_ip_created
  ON ai_consult_logs(ip_address, created_at DESC);
