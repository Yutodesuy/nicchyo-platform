create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  description text,
  category_id uuid references public.categories(id),
  price integer,
  is_available boolean default true,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'public can read products'
  ) then
    execute 'create policy "public can read products" on public.products for select using (true)';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'vendors manage own products'
  ) then
    execute 'create policy "vendors manage own products" on public.products for all using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id)';
  end if;
end;
$$;
