create table products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  description text,
  category_id uuid references categories(id),
  price integer, -- 円単位
  is_available boolean default true,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products enable row level security;

create policy "public can read products"
on products
for select
using (true);

create policy "vendors manage own products"
on products
for all
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);
