-- vendors テーブルに店舗情報フィールドを追加
alter table vendors
  add column if not exists main_products   text[]  default '{}',
  add column if not exists payment_methods text[]  default '{}',
  add column if not exists rain_policy     text    default 'undecided',
  add column if not exists schedule        text[]  default '{}';
