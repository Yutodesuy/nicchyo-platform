create table if not exists web_daily_visitor_summaries (
  visit_date date not null,
  visitor_key text not null,
  user_id uuid,
  user_role text,
  total_duration_seconds integer not null default 0 check (total_duration_seconds >= 0),
  page_view_count integer not null default 0 check (page_view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (visit_date, visitor_key)
);

create index if not exists web_daily_visitor_summaries_visit_date_idx
on web_daily_visitor_summaries (visit_date desc);

create index if not exists web_daily_visitor_summaries_role_idx
on web_daily_visitor_summaries (user_role, visit_date desc);

alter table web_daily_visitor_summaries enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'web_daily_visitor_summaries'
      and policyname = 'admins read daily visitor summaries'
  ) then
    create policy "admins read daily visitor summaries"
    on web_daily_visitor_summaries
    for select
    using (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role')
      in ('admin', 'super_admin')
    );
  end if;
end $$;

create or replace function record_web_page_visit(
  p_visit_date date,
  p_visitor_key text,
  p_path text,
  p_duration_seconds integer,
  p_user_id uuid,
  p_user_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into web_page_analytics (
    visit_date,
    visitor_key,
    path,
    duration_seconds,
    user_id,
    user_role
  )
  values (
    p_visit_date,
    p_visitor_key,
    p_path,
    greatest(0, least(coalesce(p_duration_seconds, 0), 86400)),
    p_user_id,
    nullif(trim(coalesce(p_user_role, '')), '')
  );

  insert into web_daily_visitor_summaries (
    visit_date,
    visitor_key,
    user_id,
    user_role,
    total_duration_seconds,
    page_view_count
  )
  values (
    p_visit_date,
    p_visitor_key,
    p_user_id,
    nullif(trim(coalesce(p_user_role, '')), ''),
    greatest(0, least(coalesce(p_duration_seconds, 0), 86400)),
    1
  )
  on conflict (visit_date, visitor_key) do update
  set
    user_id = coalesce(web_daily_visitor_summaries.user_id, excluded.user_id),
    user_role = case
      when excluded.user_role in ('admin', 'super_admin') then excluded.user_role
      when web_daily_visitor_summaries.user_role in ('admin', 'super_admin') then web_daily_visitor_summaries.user_role
      when excluded.user_role = 'vendor' then excluded.user_role
      when web_daily_visitor_summaries.user_role = 'vendor' then web_daily_visitor_summaries.user_role
      else coalesce(web_daily_visitor_summaries.user_role, excluded.user_role)
    end,
    total_duration_seconds = web_daily_visitor_summaries.total_duration_seconds + excluded.total_duration_seconds,
    page_view_count = web_daily_visitor_summaries.page_view_count + 1,
    updated_at = now();
end;
$$;

grant execute on function record_web_page_visit(date, text, text, integer, uuid, text) to anon, authenticated, service_role;

insert into web_daily_visitor_summaries (
  visit_date,
  visitor_key,
  user_id,
  user_role,
  total_duration_seconds,
  page_view_count
)
select
  visit_date,
  visitor_key,
  (
    array_agg(user_id order by created_at desc)
    filter (where user_id is not null)
  )[1] as user_id,
  (
    array_agg(
      user_role
      order by
        case
          when user_role in ('admin', 'super_admin') then 3
          when user_role = 'vendor' then 2
          when user_role is not null then 1
          else 0
        end desc
    )
  )[1] as user_role,
  coalesce(sum(duration_seconds), 0) as total_duration_seconds,
  count(*) as page_view_count
from web_page_analytics
group by visit_date, visitor_key
on conflict (visit_date, visitor_key) do update
set
  user_id = excluded.user_id,
  user_role = excluded.user_role,
  total_duration_seconds = excluded.total_duration_seconds,
  page_view_count = excluded.page_view_count,
  updated_at = now();
