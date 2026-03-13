create table if not exists map_landmarks (
  key text primary key,
  name text not null,
  description text not null default '',
  image_url text not null,
  latitude double precision not null,
  longitude double precision not null,
  width_px double precision not null check (width_px > 0),
  height_px double precision not null check (height_px > 0),
  show_at_min_zoom boolean not null default false,
  created_at timestamptz not null default now()
);

alter table map_landmarks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_landmarks'
      and policyname = 'public read map landmarks'
  ) then
    create policy "public read map landmarks"
    on map_landmarks
    for select
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_landmarks'
      and policyname = 'admin manage map landmarks'
  ) then
    create policy "admin manage map landmarks"
    on map_landmarks
    for all
    using (
      exists (
        select 1 from vendors
        where vendors.id = auth.uid()
        and vendors.role = 'admin'
      )
    )
    with check (
      exists (
        select 1 from vendors
        where vendors.id = auth.uid()
        and vendors.role = 'admin'
      )
    );
  end if;
end $$;

insert into map_landmarks (
  key,
  name,
  description,
  image_url,
  latitude,
  longitude,
  width_px,
  height_px,
  show_at_min_zoom
)
values
  (
    'museum',
    '高知県立高知城歴史博物館',
    '土佐藩や高知城の歴史を学べる博物館。企画展や収蔵資料の展示も行われます。',
    '/images/maps/elements/buildings/KochiCastleMusium2.png',
    33.5599801,
    133.5340747,
    201.6,
    113.4,
    false
  ),
  (
    'otepia',
    'オーテピア',
    '図書館・科学館・点字図書館が入る複合施設。観光の立ち寄り先としても使いやすい場所です。',
    '/images/maps/elements/buildings/Ohtepia.png',
    33.5605212,
    133.5371029,
    174.72,
    98.28,
    false
  ),
  (
    'castle',
    '高知城',
    '江戸時代の天守と本丸御殿が残る高知の代表的な史跡。日曜市周辺のランドマークです。',
    '/images/maps/elements/buildings/KochiCastle.png',
    33.5615208,
    133.5311987,
    358.4,
    238.9333333333333,
    true
  ),
  (
    'densha',
    'チンチン電車',
    '高知市内を走る路面電車。街歩きの目印としても分かりやすい移動インフラです。',
    '/images/maps/elements/buildings/Train.png',
    33.5613531,
    133.543104,
    143.36,
    71.68,
    true
  ),
  (
    'station',
    '高知駅',
    'JR高知駅。県外から日曜市へ向かうときの主要な玄関口です。',
    '/images/maps/elements/buildings/kochistation.png',
    33.5671869,
    133.5436682,
    120.96,
    80.64,
    true
  ),
  (
    'ohtemae-school',
    '追手前高校',
    '日曜市エリア近くにある高校で、地図上では周辺位置を把握する目印になります。',
    '/images/maps/elements/buildings/ohtemae-school.png',
    33.5616992,
    133.5365687,
    127.68,
    85.12,
    false
  ),
  (
    'hirome-market',
    'ひろめ市場',
    '高知の名物グルメが集まる人気スポット。日曜市と合わせて回りやすい観光拠点です。',
    '/images/maps/elements/buildings/hirome-market.png',
    33.5605993,
    133.535527,
    127.68,
    85.12,
    false
  )
on conflict (key) do nothing;
