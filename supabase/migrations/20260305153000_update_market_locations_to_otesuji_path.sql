-- Update market_locations coordinates to follow Otesuji path.
-- Path definition (center line):
-- 1) (133.5429279, 33.5622037) -> (133.5411898, 33.5622037)
-- 2) (133.5411898, 33.5622037) -> (133.5336783, 33.5606199)
--
-- 300 stores are mapped as:
-- - 1..150   : one side (+normal)
-- - 151..300 : opposite side (-normal)
-- with 7.5m offset from center line.

with constants as (
  select
    33.5622037::double precision as p0_lat,
    133.5429279::double precision as p0_lng,
    33.5622037::double precision as p1_lat,
    133.5411898::double precision as p1_lng,
    33.5606199::double precision as p2_lat,
    133.5336783::double precision as p2_lng,
    7.5::double precision as side_offset_m,
    149.0::double precision as side_den
),
segment_lengths as (
  select
    c.*,
    sqrt(
      power((c.p1_lat - c.p0_lat) * 110540.0, 2) +
      power((c.p1_lng - c.p0_lng) * (111320.0 * cos(radians((c.p0_lat + c.p1_lat) / 2.0))), 2)
    ) as l1_m,
    sqrt(
      power((c.p2_lat - c.p1_lat) * 110540.0, 2) +
      power((c.p2_lng - c.p1_lng) * (111320.0 * cos(radians((c.p1_lat + c.p2_lat) / 2.0))), 2)
    ) as l2_m
  from constants c
),
base as (
  select
    m.id,
    m.store_number,
    case
      when m.store_number between 1 and 150 then 1.0
      when m.store_number between 151 and 300 then -1.0
      else null
    end as side_sign,
    case
      when m.store_number between 1 and 150 then (m.store_number - 1)::double precision
      when m.store_number between 151 and 300 then (m.store_number - 151)::double precision
      else null
    end as slot_idx
  from public.market_locations m
  where m.store_number between 1 and 300
),
centerline as (
  select
    b.id,
    b.side_sign,
    (b.slot_idx / s.side_den) as t,
    s.*
  from base b
  cross join segment_lengths s
),
center_and_tangent as (
  select
    c.id,
    c.side_sign,
    case
      when (c.t * (c.l1_m + c.l2_m)) <= c.l1_m then
        c.p0_lat + (c.p1_lat - c.p0_lat) * ((c.t * (c.l1_m + c.l2_m)) / nullif(c.l1_m, 0))
      else
        c.p1_lat + (c.p2_lat - c.p1_lat) * (((c.t * (c.l1_m + c.l2_m)) - c.l1_m) / nullif(c.l2_m, 0))
    end as center_lat,
    case
      when (c.t * (c.l1_m + c.l2_m)) <= c.l1_m then
        c.p0_lng + (c.p1_lng - c.p0_lng) * ((c.t * (c.l1_m + c.l2_m)) / nullif(c.l1_m, 0))
      else
        c.p1_lng + (c.p2_lng - c.p1_lng) * (((c.t * (c.l1_m + c.l2_m)) - c.l1_m) / nullif(c.l2_m, 0))
    end as center_lng,
    case
      when (c.t * (c.l1_m + c.l2_m)) <= c.l1_m then (c.p1_lat - c.p0_lat)
      else (c.p2_lat - c.p1_lat)
    end as tan_lat,
    case
      when (c.t * (c.l1_m + c.l2_m)) <= c.l1_m then (c.p1_lng - c.p0_lng)
      else (c.p2_lng - c.p1_lng)
    end as tan_lng,
    c.side_offset_m
  from centerline c
),
vectors as (
  select
    t.id,
    t.side_sign,
    t.center_lat,
    t.center_lng,
    ((t.tan_lng) * (111320.0 * cos(radians(t.center_lat)))) as tx_m,
    ((t.tan_lat) * 110540.0) as ty_m,
    t.side_offset_m
  from center_and_tangent t
),
normalized as (
  select
    v.id,
    v.side_sign,
    v.center_lat,
    v.center_lng,
    (-v.ty_m / nullif(sqrt(v.tx_m * v.tx_m + v.ty_m * v.ty_m), 0)) as nx,
    ( v.tx_m / nullif(sqrt(v.tx_m * v.tx_m + v.ty_m * v.ty_m), 0)) as ny,
    v.side_offset_m
  from vectors v
),
new_coords as (
  select
    n.id,
    (n.center_lat + ((n.side_sign * n.ny * n.side_offset_m) / 110540.0)) as latitude,
    (n.center_lng + ((n.side_sign * n.nx * n.side_offset_m) / (111320.0 * cos(radians(n.center_lat))))) as longitude
  from normalized n
)
update public.market_locations m
set
  latitude = c.latitude,
  longitude = c.longitude
from new_coords c
where m.id = c.id;
