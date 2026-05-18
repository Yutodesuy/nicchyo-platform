-- map-layout 更新・復元をアトミックに実行する SQL 関数群
--
-- 問題: route.ts と snapshots/route.ts が複数テーブルを逐次更新しており、
-- 途中失敗で部分書き込みが残る（特に map_route_points の全件削除→insert が致命的）
-- 解決: 危険な操作を RPC 関数でトランザクション内に閉じる

-- ─── replace_map_route_points ────────────────────────────────────────────
-- map_route_points の全件削除→再挿入をアトミックに実行する
--
-- 引数: p_points jsonb — {id, latitude, longitude, sort_order, branch_from_id?}[] の配列
-- 呼び出し元: PUT /api/admin/map-layout
CREATE OR REPLACE FUNCTION replace_map_route_points(p_points jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 全件削除
  DELETE FROM map_route_points;

  -- branch_from_id は自己参照 FK のため、まず branch_from_id なしで挿入してから UPDATE する
  IF p_points IS NOT NULL AND jsonb_array_length(p_points) > 0 THEN
    INSERT INTO map_route_points (id, latitude, longitude, sort_order)
    SELECT
      elem->>'id',
      (elem->>'latitude')::double precision,
      (elem->>'longitude')::double precision,
      (elem->>'sort_order')::integer
    FROM jsonb_array_elements(p_points) AS elem;

    UPDATE map_route_points rp
    SET branch_from_id = elem->>'branch_from_id'
    FROM jsonb_array_elements(p_points) AS elem
    WHERE rp.id = elem->>'id'
      AND (elem->>'branch_from_id') IS NOT NULL
      AND (elem->>'branch_from_id') <> '';
  END IF;
END;
$$;

-- ─── restore_map_layout_snapshot ─────────────────────────────────────────
-- スナップショットからマップレイアウト全体をアトミックに復元する
--
-- 引数:
--   p_shops       jsonb — EditableShop[] ({locationId, position, lat, lng, vendorId?}[])
--   p_landmarks   jsonb — Landmark[] ({key, name, description, url, lat, lng, widthPx, heightPx, showAtMinZoom}[])
--   p_route_points jsonb — MapRoutePoint[] ({id, lat, lng, order, branchFromId?}[])
--   p_route_config jsonb — MapRouteConfig ({key, roadHalfWidthMeters, snapDistanceMeters, visibleDistanceMeters})
-- 呼び出し元: POST /api/admin/map-layout/snapshots
CREATE OR REPLACE FUNCTION restore_map_layout_snapshot(
  p_shops        jsonb,
  p_landmarks    jsonb,
  p_route_points jsonb,
  p_route_config jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today text := to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD');
BEGIN
  -- ① market_locations を upsert（スナップショット内容で更新）
  IF p_shops IS NOT NULL AND jsonb_array_length(p_shops) > 0 THEN
    INSERT INTO market_locations (id, store_number, latitude, longitude)
    SELECT
      elem->>'locationId',
      (elem->>'position')::integer,
      (elem->>'lat')::double precision,
      (elem->>'lng')::double precision
    FROM jsonb_array_elements(p_shops) AS elem
    ON CONFLICT (id) DO UPDATE SET
      store_number = EXCLUDED.store_number,
      latitude     = EXCLUDED.latitude,
      longitude    = EXCLUDED.longitude;
  END IF;

  -- ② location_assignments を全クリア（現在の全 location に紐づくもの）
  DELETE FROM location_assignments
  WHERE location_id IN (SELECT id FROM market_locations);

  -- ③ location_assignments を再挿入（vendor が紐づくもののみ）
  IF p_shops IS NOT NULL AND jsonb_array_length(p_shops) > 0 THEN
    INSERT INTO location_assignments (location_id, vendor_id, market_date)
    SELECT
      elem->>'locationId',
      elem->>'vendorId',
      v_today
    FROM jsonb_array_elements(p_shops) AS elem
    WHERE (elem->>'vendorId') IS NOT NULL AND (elem->>'vendorId') <> '';
  END IF;

  -- ④ スナップショットにない market_locations を削除
  IF p_shops IS NOT NULL AND jsonb_array_length(p_shops) > 0 THEN
    DELETE FROM market_locations
    WHERE id NOT IN (
      SELECT elem->>'locationId'
      FROM jsonb_array_elements(p_shops) AS elem
    );
  ELSE
    DELETE FROM market_locations;
  END IF;

  -- ⑤ map_landmarks を upsert（スナップショット内容で更新）
  IF p_landmarks IS NOT NULL AND jsonb_array_length(p_landmarks) > 0 THEN
    INSERT INTO map_landmarks (key, name, description, image_url, latitude, longitude, width_px, height_px, show_at_min_zoom)
    SELECT
      elem->>'key',
      elem->>'name',
      elem->>'description',
      elem->>'url',
      (elem->>'lat')::double precision,
      (elem->>'lng')::double precision,
      (elem->>'widthPx')::integer,
      (elem->>'heightPx')::integer,
      (elem->>'showAtMinZoom')::boolean
    FROM jsonb_array_elements(p_landmarks) AS elem
    ON CONFLICT (key) DO UPDATE SET
      name            = EXCLUDED.name,
      description     = EXCLUDED.description,
      image_url       = EXCLUDED.image_url,
      latitude        = EXCLUDED.latitude,
      longitude       = EXCLUDED.longitude,
      width_px        = EXCLUDED.width_px,
      height_px       = EXCLUDED.height_px,
      show_at_min_zoom = EXCLUDED.show_at_min_zoom;
  END IF;

  -- ⑥ スナップショットにない map_landmarks を削除
  IF p_landmarks IS NOT NULL AND jsonb_array_length(p_landmarks) > 0 THEN
    DELETE FROM map_landmarks
    WHERE key NOT IN (
      SELECT elem->>'key'
      FROM jsonb_array_elements(p_landmarks) AS elem
    );
  ELSE
    DELETE FROM map_landmarks;
  END IF;

  -- ⑦ map_route_points を全削除し、スナップショットから再挿入
  -- branch_from_id 自己参照 FK のため、先に id のみ挿入してから UPDATE する
  DELETE FROM map_route_points;

  IF p_route_points IS NOT NULL AND jsonb_array_length(p_route_points) > 0 THEN
    INSERT INTO map_route_points (id, latitude, longitude, sort_order)
    SELECT
      elem->>'id',
      (elem->>'lat')::double precision,
      (elem->>'lng')::double precision,
      (elem->>'order')::integer
    FROM jsonb_array_elements(p_route_points) AS elem;

    UPDATE map_route_points rp
    SET branch_from_id = elem->>'branchFromId'
    FROM jsonb_array_elements(p_route_points) AS elem
    WHERE rp.id = elem->>'id'
      AND (elem->>'branchFromId') IS NOT NULL
      AND (elem->>'branchFromId') <> '';
  END IF;

  -- ⑧ map_route_configs を upsert
  IF p_route_config IS NOT NULL AND p_route_config <> 'null'::jsonb THEN
    INSERT INTO map_route_configs (key, road_half_width_meters, snap_distance_meters, visible_distance_meters)
    VALUES (
      p_route_config->>'key',
      (p_route_config->>'roadHalfWidthMeters')::double precision,
      (p_route_config->>'snapDistanceMeters')::double precision,
      (p_route_config->>'visibleDistanceMeters')::double precision
    )
    ON CONFLICT (key) DO UPDATE SET
      road_half_width_meters  = EXCLUDED.road_half_width_meters,
      snap_distance_meters    = EXCLUDED.snap_distance_meters,
      visible_distance_meters = EXCLUDED.visible_distance_meters,
      updated_at              = now();
  END IF;
END;
$$;
