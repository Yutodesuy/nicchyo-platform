-- 出店者投稿画像用 Storage バケット
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-images',
  'vendor-images',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 出店者は自分のフォルダにのみアップロード可能
-- パス形式: {vendor_id}/{filename}
create policy "vendors can upload own images"
on storage.objects
for insert
with check (
  bucket_id = 'vendor-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- 画像は公開（マップ上で表示するため）
create policy "public can view vendor images"
on storage.objects
for select
using (bucket_id = 'vendor-images');

-- 出店者は自分のフォルダの画像のみ削除可能
create policy "vendors can delete own images"
on storage.objects
for delete
using (
  bucket_id = 'vendor-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
