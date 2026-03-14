-- AIばあちゃんへの相談ログ
create table if not exists public.ai_consult_logs (
  id              uuid        primary key default gen_random_uuid(),
  store_id        text,       -- vendor UUID（特定店舗への相談の場合）
  question_text   text        not null,
  intent_category text,       -- '人気商品' | '味' | '行列' | '営業時間' | 'おすすめ' | 'その他'
  keywords        text[]      default '{}',
  location_type   text        default 'unknown', -- 'pre_visit' | 'on_site' | 'unknown'
  is_recommendation boolean   default false,     -- この店をAIが紹介したか
  consulted_at    timestamptz not null default now()
);

alter table public.ai_consult_logs enable row level security;

-- 書き込みはサービスロール経由（APIから）
-- 出店者は自分の店舗ログのみ読み取り可能
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_consult_logs'
      and policyname = 'vendors can read own store logs'
  ) then
    create policy "vendors can read own store logs"
    on public.ai_consult_logs
    for select
    using (store_id = auth.uid()::text);
  end if;
end $$;

create index if not exists idx_ai_consult_logs_store_id on public.ai_consult_logs (store_id);
create index if not exists idx_ai_consult_logs_consulted_at on public.ai_consult_logs (consulted_at);
