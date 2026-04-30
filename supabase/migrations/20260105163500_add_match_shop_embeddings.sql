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
language plpgsql
stable
as $$
begin
  if to_regclass('public.shop_embeddings') is null then
    return;
  end if;

  return query execute
    'select
      shop_id,
      1 - (embedding <=> $1) as similarity
    from public.shop_embeddings
    where 1 - (embedding <=> $1) > $2
    order by embedding <=> $1
    limit $3'
  using query_embedding, match_threshold, match_count;
end;
$$;
