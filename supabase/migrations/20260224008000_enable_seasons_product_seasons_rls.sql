alter table seasons enable row level security;

create policy "public read seasons"
on seasons
for select
using (true);

alter table product_seasons enable row level security;

create policy "public read product_seasons"
on product_seasons
for select
using (true);

create policy "vendors manage own product seasons"
on product_seasons
for all
using (
  exists (
    select 1 from products
    where products.id = product_seasons.product_id
    and products.vendor_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from products
    where products.id = product_seasons.product_id
    and products.vendor_id = auth.uid()
  )
);
