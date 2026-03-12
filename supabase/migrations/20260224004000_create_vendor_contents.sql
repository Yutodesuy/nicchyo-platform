create table vendor_contents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  title text not null,
  body text,
  category_id uuid references categories(id),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table vendor_contents enable row level security;

create policy "public can read active contents"
on vendor_contents
for select
using (expires_at > now());

create policy "vendors can read own contents"
on vendor_contents
for select
using (auth.uid() = vendor_id);

create policy "vendors can insert own contents"
on vendor_contents
for insert
with check (auth.uid() = vendor_id);

create policy "vendors can update own contents"
on vendor_contents
for update
using (auth.uid() = vendor_id);

create policy "vendors can delete own contents"
on vendor_contents
for delete
using (auth.uid() = vendor_id);
