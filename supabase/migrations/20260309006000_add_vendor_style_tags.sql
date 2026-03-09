-- vendors テーブルに出店スタイルタグフィールドを追加
alter table vendors
  add column if not exists style_tags text[] default '{}';
