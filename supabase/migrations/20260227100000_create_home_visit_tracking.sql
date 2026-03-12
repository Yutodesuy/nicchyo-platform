create table if not exists web_visitor_daily_uniques (
  visit_date date not null,
  visitor_key text not null,
  created_at timestamp with time zone default now(),
  primary key (visit_date, visitor_key)
);

alter table web_visitor_daily_uniques enable row level security;

create policy "admins read web visitor daily uniques"
on web_visitor_daily_uniques
for select
using (
  exists (
    select 1
    from vendors
    where vendors.id = auth.uid()
      and vendors.role = 'admin'
  )
);

create policy "admins manage web visitor daily uniques"
on web_visitor_daily_uniques
for all
using (
  exists (
    select 1
    from vendors
    where vendors.id = auth.uid()
      and vendors.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from vendors
    where vendors.id = auth.uid()
      and vendors.role = 'admin'
  )
);

create or replace function track_home_visit(p_visit_date date, p_visitor_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into web_visitor_daily_uniques (visit_date, visitor_key)
  values (p_visit_date, p_visitor_key)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    return false;
  end if;

  insert into web_visitor_stats (visit_date, visitor_count)
  values (p_visit_date, 1)
  on conflict (visit_date) do update
    set visitor_count = web_visitor_stats.visitor_count + 1,
        updated_at = now();

  return true;
end;
$$;
