/**
 * 店舗表示設定の中央管理ファイル
 *
 * 【目的】
 * - 店舗イラストのサイズ、間隔、表示ルールを一元管理
 * - 将来のイラスト差し替え・サイズ変更に対応
 * - 表示の公平性を保証する
 *
 * 【設計方針】
 * 1. ハードコード禁止: すべての値をこの設定から取得
 * 2. レスポンシブ対応: 画面サイズ・ズーム倍率の変化に追従
 * 3. 公平性の保証: 特定店舗だけが優遇されない仕組み
 * 4. 拡張性: 新しいイラストタイプの追加が容易
 */

/**
 * 店舗イラストのサイズ定義
 * 【重要】イラストを差し替える場合はここを変更
 */
export interface IllustrationSize {
  /** SVG/画像の幅（px） */
  width: number;
  /** SVG/画像の高さ（px） */
  height: number;
  /** Leafletマーカーのアンカーポイント [x, y] （イラストの基準点） */
  anchor: [number, number];
  /** 吹き出しの横オフセット（px） */
  bubbleOffset: number;
}

/**
 * イラストサイズのプリセット
 */
export const ILLUSTRATION_SIZES: Record<
  'small' | 'medium' | 'large',
  IllustrationSize
> = {
  small: {
    width: 40,
    height: 40,
    anchor: [20, 35], // 下部中央
    bubbleOffset: 25,
  },
  medium: {
    width: 60,
    height: 60,
    anchor: [30, 50], // 下部中央
    bubbleOffset: 35,
  },
  large: {
    width: 80,
    height: 80,
    anchor: [40, 70], // 下部中央
    bubbleOffset: 45,
  },
};

/**
 * デフォルトで使用するイラストサイズ
 * 【将来の変更】ここを変えるだけで全体のサイズが変わる
 */
export const DEFAULT_ILLUSTRATION_SIZE: 'small' | 'medium' | 'large' =
  'medium';

/**
 * ズームレベルごとの表示ルール
 */
export interface ZoomDisplayRule {
  /** このルールが適用される最小ズームレベル */
  minZoom: number;
  /** 店舗フィルタリング間隔（例: 3なら3店舗に1つ表示） */
  filterInterval: number;
  /** 店舗詳細（バナー）の表示を許可するか */
  allowShopDetails: boolean;
  /** 店舗情報（名前・吹き出し）の表示を許可するか */
  allowShopInfo: boolean;
  /** 説明テキスト */
  description: string;
}

/**
 * ズーム段階別の表示ルール
 *
 * 【公平性の保証】
 * - filterInterval を使った間引きは「回転式」で公平に配分
 * - 特定の店舗だけが常に表示されることはない
 */
export const ZOOM_DISPLAY_RULES: ZoomDisplayRule[] = [
  {
    minZoom: 17.0,
    filterInterval: 1, // 全店舗表示
    allowShopDetails: true,
    allowShopInfo: true,
    description: '詳細表示 - 全店舗',
  },
  {
    minZoom: 16.5,
    filterInterval: 3, // 3店舗に1つ
    allowShopDetails: false,
    allowShopInfo: true,
    description: '中距離表示',
  },
  {
    minZoom: 15.0,
    filterInterval: 10, // 10店舗に1つ
    allowShopDetails: false,
    allowShopInfo: true,
    description: '俯瞰表示',
  },
  {
    minZoom: 0,
    filterInterval: 20, // 20店舗に1つ
    allowShopDetails: false,
    allowShopInfo: false,
    description: '広域表示',
  },
];

/**
 * 店舗間隔の設定
 *
 * 【動的計算】
 * - 店舗数、道路の長さ、イラストサイズから自動計算
 * - 固定値は使わない
 */
export interface SpacingConfig {
  /** 店舗間の最小ピクセル間隔（ズーム18基準） */
  minPixelsPerShop: number;
  /** 道路幅のオフセット係数（道路の長さに対する比率） */
  roadWidthOffsetRatio: number;
}

export const SPACING_CONFIG: SpacingConfig = {
  // 店舗イラストが重ならないための最小間隔
  // イラストサイズ + 余白 を考慮
  minPixelsPerShop: 80,

  // 道路幅のオフセット（道路の中心線からの距離）
  // 1.3km の道路に対して 50m ≈ 0.038 (3.8%)
  roadWidthOffsetRatio: 0.038,
};

/**
 * 現在のズームレベルに適用される表示ルールを取得
 *
 * @param currentZoom 現在のズームレベル
 * @returns 適用される表示ルール
 */
export function getDisplayRuleForZoom(
  currentZoom: number
): ZoomDisplayRule {
  // ズームレベルが高い順（詳細表示優先）でルールを検索
  for (let i = 0; i < ZOOM_DISPLAY_RULES.length; i++) {
    if (currentZoom >= ZOOM_DISPLAY_RULES[i].minZoom) {
      return ZOOM_DISPLAY_RULES[i];
    }
  }

  // フォールバック（最も広域なルール）
  return ZOOM_DISPLAY_RULES[ZOOM_DISPLAY_RULES.length - 1];
}

/**
 * 店舗詳細（バナー）を開くことができるかチェック
 *
 * @param currentZoom 現在のズームレベル
 * @returns 開くことができる場合 true
 */
export function canOpenShopDetails(currentZoom: number): boolean {
  const rule = getDisplayRuleForZoom(currentZoom);
  return rule.allowShopDetails;
}

/**
 * 店舗情報（名前・吹き出し）を表示できるかチェック
 *
 * @param currentZoom 現在のズームレベル
 * @returns 表示できる場合 true
 */
export function canShowShopInfo(currentZoom: number): boolean {
  const rule = getDisplayRuleForZoom(currentZoom);
  return rule.allowShopInfo;
}

/**
 * 最小ズームレベルで店舗詳細を開けるレベルを取得
 */
export function getMinZoomForShopDetails(): number {
  const detailRule = ZOOM_DISPLAY_RULES.find((rule) => rule.allowShopDetails);
  return detailRule?.minZoom ?? 17.0;
}
