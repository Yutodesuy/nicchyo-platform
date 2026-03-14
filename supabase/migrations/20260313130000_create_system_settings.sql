create table if not exists system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table system_settings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'admins read system settings'
  ) then
    create policy "admins read system settings"
    on system_settings
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
      and tablename = 'system_settings'
      and policyname = 'admins manage system settings'
  ) then
    create policy "admins manage system settings"
    on system_settings
    for all
    using (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role')
      in ('admin', 'super_admin')
    )
    with check (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role')
      in ('admin', 'super_admin')
    );
  end if;
end $$;

insert into system_settings (key, value)
values
  (
    'public',
    jsonb_build_object(
      'siteName', 'nicchyo',
      'maintenanceMode', false,
      'maintenanceMessage', '',
      'publicAnnouncementEnabled', false,
      'publicAnnouncement', ''
    )
  ),
  (
    'map',
    jsonb_build_object(
      'maxLandmarks', 80,
      'maxUnassignedShopMarkers', 40,
      'maxMapSnapshots', 50,
      'maxEditZoom', 20
    )
  )
on conflict (key) do nothing;
