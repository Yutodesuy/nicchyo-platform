-- 店舗ページビュー追跡テーブル
create table if not exists shop_page_views (
  id        uuid  primary key default gen_random_uuid(),
  vendor_id uuid  not null references vendors(id) on delete cascade,
  source    text  default 'direct',   -- 'map' | 'search' | 'direct'
  viewed_at timestamptz not null default now()
);

alter table shop_page_views enable row level security;

-- 誰でも記録可能（匿名アクセスを含む）
create policy "anyone can insert page views"
on shop_page_views
for insert
with check (true);

-- 出店者は自分の店舗ビューのみ閲覧可能
create policy "vendors can read own page views"
on shop_page_views
for select
using (auth.uid() = vendor_id);
