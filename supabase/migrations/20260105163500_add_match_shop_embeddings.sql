create extension if not exists vector;

create or replace function public.match_shop_embeddings(
  query_embedding vector(1536),
  match_count int,
  match_threshold float
)
returns table (
  shop_id uuid,
  similarity float
)
language sql
stable
as $$
  select
    shop_id,
    1 - (embedding <=> query_embedding) as similarity
  from public.shop_embeddings
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
