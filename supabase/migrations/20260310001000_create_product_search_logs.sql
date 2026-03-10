-- ユーザーの商品検索キーワードをログに記録するテーブル
create table if not exists public.product_search_logs (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  result_count integer not null default 0,
  searched_at timestamptz not null default now()
);

-- 全員が書き込み可能（認証不要）、読み取りは不可
alter table public.product_search_logs enable row level security;

create policy "anyone can insert search logs"
on public.product_search_logs
for insert
with check (true);

-- インデックス（集計クエリの高速化）
create index if not exists idx_product_search_logs_keyword on public.product_search_logs (keyword);
create index if not exists idx_product_search_logs_searched_at on public.product_search_logs (searched_at);
