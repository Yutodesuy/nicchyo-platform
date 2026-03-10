-- 出店者がAIばあちゃんに教える店舗知識テーブル
create extension if not exists vector;

create table if not exists public.store_knowledge (
  id          uuid        primary key default gen_random_uuid(),
  store_id    text        not null,   -- vendor UUID
  content     text        not null,
  embedding   vector(1536),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.store_knowledge enable row level security;

-- 出店者は自分の知識のみ操作可能
create policy "vendors manage own knowledge"
on public.store_knowledge
for all
using (store_id = auth.uid()::text)
with check (store_id = auth.uid()::text);

-- APIからのサービスロール書き込みは RLS バイパス
-- （service_role は RLS を自動的にバイパスする）

-- ベクトル検索関数
create or replace function public.match_store_knowledge(
  query_embedding vector(1536),
  target_store_id text,
  match_count     int     default 3,
  match_threshold float   default 0.5
)
returns table (
  id         uuid,
  store_id   text,
  content    text,
  similarity float
)
language plpgsql
stable
as $$
begin
  return query
    select
      sk.id,
      sk.store_id,
      sk.content,
      1 - (sk.embedding <=> query_embedding) as similarity
    from public.store_knowledge sk
    where
      sk.store_id = target_store_id
      and sk.embedding is not null
      and 1 - (sk.embedding <=> query_embedding) > match_threshold
    order by sk.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- インデックス
create index if not exists idx_store_knowledge_store_id on public.store_knowledge (store_id);
