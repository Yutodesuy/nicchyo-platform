-- 商品販売数量テーブル
create table if not exists product_sales (
  id           uuid    primary key default gen_random_uuid(),
  vendor_id    uuid    not null references vendors(id) on delete cascade,
  product_name text    not null,
  quantity     integer not null check (quantity > 0),
  sale_date    date    not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (vendor_id, product_name, sale_date)
);

alter table product_sales enable row level security;

-- 出店者は自分のデータのみ管理可能
create policy "vendors can manage own product_sales"
on product_sales
for all
using  (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

-- 市場トレンド集計のために全員が読める
create policy "public can read product_sales"
on product_sales
for select
using (true);
