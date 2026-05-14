-- 出店者プロフィール拡張：店舗写真・SNSリンク・営業時間
alter table vendors
  add column if not exists shop_image_url      text,
  add column if not exists sns_instagram       text,
  add column if not exists sns_x               text,
  add column if not exists sns_hp              text,
  add column if not exists business_hours_start text,
  add column if not exists business_hours_end   text;
