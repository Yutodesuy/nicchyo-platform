export type GrandmaEventMessage = {
  id: string;
  text: string;
  image?: string;
};

export type GrandmaEvent = {
  id: string;
  title: string;
  location: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
  messages: GrandmaEventMessage[];
};

export const grandmaEvents: GrandmaEvent[] = [
  {
    id: 'kochi-castle-museum',
    title: '高知城歴史博物館',
    location: {
      lat: 33.5635,
      lng: 133.5286,
      radiusMeters: 90,
    },
    messages: [
      { id: 'm1', text: 'ここは高知城歴史博物館よ。土佐の歴史がぎゅっと詰まってるの。' },
      { id: 'm2', text: 'お城のふもとにあるから、散歩のついでに寄る人も多いわね。' },
      { id: 'm3', text: '企画展もよくやってるから、季節ごとに楽しめるのよ。' },
      {
        id: 'm4',
        text: '外観もきれいだから、写真を撮っておくといいわよ。',
        image: '/images/maps/elements/buildings/KochiCastleMusium2.png',
      },
      { id: 'm5', text: '今度は別の場所でも案内してあげるね。' },
    ],
  },
  {
    id: 'otepia',
    title: 'オーテピア（図書館）',
    location: {
      lat: 33.5599,
      lng: 133.5286,
      radiusMeters: 90,
    },
    messages: [
      { id: 'o1', text: 'ここはオーテピア。静かな時間を過ごすのにぴったりよ。' },
      { id: 'o2', text: '勉強する人も、調べものをする人も、みんな集まる場所ね。' },
      { id: 'o3', text: '外はにぎやかでも、中は落ち着いていて好きなの。' },
      {
        id: 'o4',
        text: '展示やイベントもあるから、ふらっと寄ってみてね。',
        image: '/images/maps/elements/buildings/Otepia2.png',
      },
      { id: 'o5', text: 'また気になる場所があれば案内するわ。' },
    ],
  },
  {
    id: 'kochi-castle',
    title: '高知城',
    location: {
      lat: 33.5707,
      lng: 133.53262,
      radiusMeters: 110,
    },
    messages: [
      { id: 'c1', text: '高知城はこのあたりよ。天守からの景色がいいの。' },
      { id: 'c2', text: '歩いて登ると、いい運動にもなるわね。' },
      { id: 'c3', text: '昔の人の暮らしを想像すると、ちょっとワクワクするわ。' },
      {
        id: 'c4',
        text: '晴れた日は写真もきれいに撮れるわよ。',
        image: '/images/maps/elements/buildings/KochiCastle.png',
      },
      { id: 'c5', text: '次は別のスポットで会いましょう。' },
    ],
  },
  {
    id: 'tintin-densha',
    title: 'チンチン電車',
    location: {
      lat: 33.55096,
      lng: 133.52992,
      radiusMeters: 100,
    },
    messages: [
      { id: 't1', text: 'チンチン電車も高知らしい景色のひとつね。' },
      { id: 't2', text: 'ゆっくり走るから、街の雰囲気を味わえるのよ。' },
      { id: 't3', text: '揺れを感じながら眺める景色もいいものよ。' },
      {
        id: 't4',
        text: '時間があるなら、ぜひ乗ってみてね。',
        image: '/images/maps/elements/buildings/TinTinDensha2.png',
      },
      { id: 't5', text: 'また案内するから、楽しみにしてて。' },
    ],
  },
];
