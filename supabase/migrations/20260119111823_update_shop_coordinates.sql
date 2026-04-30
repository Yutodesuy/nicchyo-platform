-- 店舗座標を正しい値に更新
-- 道路イラスト上での正しい配置に合わせる
--
-- 座標計算:
-- - startLat = 33.56500 (高知城前/西側)
-- - latStep = 0.000078 (150店舗分の間隔)
-- - centerLng = 133.53100
-- - 北側(right): lng = 133.53115
-- - 南側(left): lng = 133.53085

do $$
begin
  if to_regclass('public.shops') is not null then
    -- 北側店舗 (legacy_id 1-150) の座標を更新
    update public.shops
    set
      lat = 33.56500 - ((legacy_id - 1) * 0.000078),
      lng = 133.53115,
      side = 'north',
      position = legacy_id - 1
    where legacy_id >= 1 and legacy_id <= 150;

    -- 南側店舗 (legacy_id 151-300) の座標を更新
    update public.shops
    set
      lat = 33.56500 - ((legacy_id - 151) * 0.000078),
      lng = 133.53085,
      side = 'south',
      position = legacy_id - 151
    where legacy_id >= 151 and legacy_id <= 300;
  end if;
end;
$$;
