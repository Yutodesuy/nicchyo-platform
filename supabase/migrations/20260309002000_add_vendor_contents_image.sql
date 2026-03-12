-- vendor_contents に画像URLカラムを追加し、title を任意に変更
alter table vendor_contents
  add column if not exists image_url text;

alter table vendor_contents
  alter column title set default '',
  alter column title drop not null;
