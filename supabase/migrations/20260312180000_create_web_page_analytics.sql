create table if not exists web_page_analytics (
  id bigserial primary key,
  visit_date date not null,
  visitor_key text not null,
  path text not null,
  duration_seconds integer not null check (duration_seconds >= 0 and duration_seconds <= 86400),
  user_id uuid,
  user_role text,
  created_at timestamptz not null default now()
);

create index if not exists web_page_analytics_visit_date_idx
on web_page_analytics (visit_date desc);

create index if not exists web_page_analytics_path_idx
on web_page_analytics (path);

create index if not exists web_page_analytics_role_idx
on web_page_analytics (user_role);

alter table web_page_analytics enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'web_page_analytics'
      and policyname = 'public insert page analytics'
  ) then
    create policy "public insert page analytics"
    on web_page_analytics
    for insert
    with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'web_page_analytics'
      and policyname = 'admins read page analytics'
  ) then
    create policy "admins read page analytics"
    on web_page_analytics
    for select
    using (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role')
      in ('admin', 'super_admin')
    );
  end if;
end $$;
