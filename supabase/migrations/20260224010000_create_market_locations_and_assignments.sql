create table market_locations (
  id uuid primary key default gen_random_uuid(),
  store_number integer not null unique,
  latitude double precision not null,
  longitude double precision not null,
  district text,
  created_at timestamptz default now()
);

create table location_assignments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references market_locations(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  market_date date not null,
  created_at timestamptz default now(),
  unique (location_id, market_date)
);

alter table location_assignments enable row level security;

create policy "public read assignments"
on location_assignments
for select
using (true);

create policy "vendors manage own assignments"
on location_assignments
for all
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

alter table market_locations enable row level security;

create policy "public read market locations"
on market_locations
for select
using (true);

create policy "admin manage market locations"
on market_locations
for all
using (
  exists (
    select 1 from vendors
    where vendors.id = auth.uid()
    and vendors.role = 'admin'
  )
)
with check (
  exists (
    select 1 from vendors
    where vendors.id = auth.uid()
    and vendors.role = 'admin'
  )
);
