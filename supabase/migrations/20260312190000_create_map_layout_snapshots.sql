create table if not exists map_layout_snapshots (
  id uuid primary key default gen_random_uuid(),
  shops_json jsonb not null,
  landmarks_json jsonb not null,
  created_by uuid,
  summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists map_layout_snapshots_created_at_idx
on map_layout_snapshots (created_at desc);

alter table map_layout_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_layout_snapshots'
      and policyname = 'admins read map layout snapshots'
  ) then
    create policy "admins read map layout snapshots"
    on map_layout_snapshots
    for select
    using (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role')
      in ('admin', 'super_admin')
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_layout_snapshots'
      and policyname = 'admins insert map layout snapshots'
  ) then
    create policy "admins insert map layout snapshots"
    on map_layout_snapshots
    for insert
    with check (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role')
      in ('admin', 'super_admin')
    );
  end if;
end $$;
