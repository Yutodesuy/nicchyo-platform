create table if not exists map_route_points (
  id text primary key,
  latitude double precision not null,
  longitude double precision not null,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create index if not exists map_route_points_sort_order_idx
on map_route_points (sort_order asc);

create table if not exists map_route_configs (
  key text primary key,
  road_half_width_meters double precision not null default 15.6,
  snap_distance_meters double precision not null default 18,
  visible_distance_meters double precision not null default 42,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into map_route_configs (
  key,
  road_half_width_meters,
  snap_distance_meters,
  visible_distance_meters
)
values ('default', 15.6, 18, 42)
on conflict (key) do nothing;

alter table map_route_points enable row level security;
alter table map_route_configs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_route_points'
      and policyname = 'public read map_route_points'
  ) then
    create policy "public read map_route_points"
    on map_route_points
    for select
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_route_configs'
      and policyname = 'public read map_route_configs'
  ) then
    create policy "public read map_route_configs"
    on map_route_configs
    for select
    using (true);
  end if;
end
$$;

alter table map_layout_snapshots
add column if not exists route_json jsonb not null default '[]'::jsonb;

alter table map_layout_snapshots
add column if not exists route_config_json jsonb not null default '{}'::jsonb;
