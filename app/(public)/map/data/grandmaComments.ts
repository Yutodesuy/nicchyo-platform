import type { GrandmaComment } from '../types/grandmaComment';

/**
 * サンプルコメント（将来は100件以上に拡張予定）
 */
export const grandmaComments: GrandmaComment[] = [
  { id: 'mono-01', genre: 'monologue', text: '💭 今日はええ風やねぇ、ゆっくり歩きや。' },
  { id: 'mono-02', genre: 'monologue', text: '💭 ここの通り、昔はもっと賑やかやったんよ。' },
  {
    id: 'event-01',
    genre: 'event',
    text: '🔔 朝市の限定お野菜、東の端で出よるで。',
    link: { href: '/map', label: 'マップで見る' },
  },
  {
    id: 'notice-01',
    genre: 'notice',
    text: '📢 bagに気になるお店を入れておくと忘れんきね。',
    link: { href: '/bag', label: 'bagを開く' },
  },
  {
    id: 'tutorial-01',
    genre: 'tutorial',
    text: '🧭 お店のピンをタップすると詳細が見えるよ。',
  },
];
