create table if not exists web_visitor_stats (
  visit_date date primary key,
  visitor_count integer not null check (visitor_count >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table web_visitor_stats enable row level security;

create policy "public read web visitor stats"
on web_visitor_stats
for select
using (true);

create policy "admins manage web visitor stats"
on web_visitor_stats
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
