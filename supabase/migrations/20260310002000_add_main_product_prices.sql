-- vendors テーブルに商品価格フィールドを追加
-- { "みかん": 200, "りんご": 150 } のような形式で格納
alter table vendors
  add column if not exists main_product_prices jsonb default '{}';
