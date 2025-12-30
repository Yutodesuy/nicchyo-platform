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
      lat: 33.563687,
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
        image: '/images/maps/elements/buildings/KochiCastleMusium.png',
      },
      { id: 'm5', text: '今度は別の場所でも案内してあげるね。' },
    ],
  },
];
