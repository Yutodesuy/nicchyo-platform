-- =====================================================================
-- 2026-04-13: Add analytics tables for secure server-side logging
-- coupon_impressions : when a coupon is shown/clicked (server-side insert only)
-- shop_interactions  : shop-specific interactions (view/click/scroll) (server-side insert only)
-- =====================================================================

-- ─── coupon_impressions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  visitor_key text,
  shop_id uuid,
  source text NOT NULL,       -- 'shop_banner' | 'menu' | 'coupon_page' | 'search'
  placement text,            -- UI位置説明
  visible_duration integer,  -- 秒（任意）
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_ci_coupon_id ON coupon_impressions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_ci_shop_id   ON coupon_impressions(shop_id);
CREATE INDEX IF NOT EXISTS idx_ci_visitor   ON coupon_impressions(visitor_key);

ALTER TABLE coupon_impressions ENABLE ROW LEVEL SECURITY;

-- Read by admins only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coupon_impressions' AND policyname = 'ci_admin_select'
  ) THEN
    CREATE POLICY ci_admin_select
      ON coupon_impressions FOR SELECT
      USING (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','super_admin')
      );
  END IF;
END $$;

-- No public INSERT policy: only service-role client should insert via API (no insert policy)


-- ─── shop_interactions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key text,
  shop_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_type text NOT NULL,   -- 'view' | 'impression' | 'scroll' | 'open_detail' | 'banner_click'
  meta jsonb,                 -- optional structured metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_si_shop_id ON shop_interactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_si_event_type ON shop_interactions(event_type);

ALTER TABLE shop_interactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shop_interactions' AND policyname = 'si_admin_select'
  ) THEN
    CREATE POLICY si_admin_select
      ON shop_interactions FOR SELECT
      USING (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','super_admin')
      );
  END IF;
END $$;

-- No public INSERT policy: service role only

-- =====================================================================
-- Notes:
-- - These tables are intended to be written only via server endpoints that use
--   the Supabase service role key. Client-side direct inserts are intentionally
--   disallowed to prevent forged data.
-- - If you need read access for specific roles, add explicit RLS policies.
-- =====================================================================
