create extension if not exists vector;

create table if not exists public.vendor_embeddings (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  store_number integer,
  shop_name text,
  content text not null,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendor_embeddings_store_number
  on public.vendor_embeddings (store_number);

create index if not exists idx_vendor_embeddings_embedding
  on public.vendor_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_vendor_embeddings(
  query_embedding vector(1536),
  match_count int,
  match_threshold float
)
returns table (
  vendor_id uuid,
  similarity float
)
language plpgsql
stable
as $$
begin
  if to_regclass('public.vendor_embeddings') is null then
    return;
  end if;

  return query execute
    'select
      vendor_id,
      1 - (embedding <=> $1) as similarity
    from public.vendor_embeddings
    where 1 - (embedding <=> $1) > $2
    order by embedding <=> $1
    limit $3'
  using query_embedding, match_threshold, match_count;
end;
$$;

drop function if exists public.match_shop_embeddings(vector, int, float);

drop table if exists public.shop_embeddings cascade;

do $$
begin
  if to_regclass('public.shops') is not null then
    execute 'drop trigger if exists shops_audit_trigger on public.shops';
  end if;
end;
$$;

drop function if exists public.log_shop_changes() cascade;
drop table if exists public.shop_audit_logs cascade;
drop table if exists public.shops cascade;
