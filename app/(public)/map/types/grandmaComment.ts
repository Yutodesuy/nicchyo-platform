export type GrandmaCommentGenre =
  | 'monologue'
  | 'event'
  | 'notice'
  | 'tutorial';

export interface GrandmaComment {
  id: string;
  text: string;
  genre: GrandmaCommentGenre;
  /**
   * 表示アイコン。未指定ならジャンルのデフォルトを使用。
   */
  icon?: string;
  /**
   * 導線がある場合に設定。例: map/recipes/events など。
   */
  link?: {
    href: string;
    label: string;
  };
}
