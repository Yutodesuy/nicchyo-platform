import type { GrandmaComment } from '../types/grandmaComment';

/**
 * おばあちゃんのコメントマスタ。
 * ここに増やせば100件以上にも対応できる。
 */
export const grandmaComments: GrandmaComment[] = [
  { id: 'mono-01', genre: 'monologue', text: '💭 今日はええ風やねぇ、ゆっくり歩きや。' },
  { id: 'mono-02', genre: 'monologue', text: '💭 ここの通り、昔はもっと賑やかやったんよ。' },
  { id: 'mono-03', genre: 'monologue', text: '💭 ちょっと休みたくなったら、ベンチ探してな。' },
  { id: 'event-01', genre: 'event', text: '⭐ その先で今日だけの品が出とるよ。' },
  { id: 'event-02', genre: 'event', text: '⭐ 気になる店はのぞくだけでもええがよ。' },
  { id: 'notice-01', genre: 'notice', text: 'ℹ️ ことづてを開くと、みんなの声が聞けるき。', link: { href: '/kotodute', label: 'ことづてとは？' } },
  { id: 'notice-02', genre: 'notice', text: 'ℹ️ 買い物増えたら bag に入れとき。', link: { href: '/bag', label: 'bagを見る' } },
  { id: 'tutorial-01', genre: 'tutorial', text: '📖 ピンを押すとお店のくわしい話が出るで。' },
  { id: 'tutorial-02', genre: 'tutorial', text: '📖 地図は指で動かして、気になるとこを見つけてな。' },
  { id: 'tutorial-03', genre: 'tutorial', text: '📖 ことづてを1つ読むと記念スタンプがつくかもよ。' },
  { id: 'event-03', genre: 'event', text: '⭐ 旬のもんは早い者勝ち、見逃さんといて。' },
  { id: 'monologue-04', genre: 'monologue', text: '💭 ほら、いい匂いがしてきたやろ。' },
];
