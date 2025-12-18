/**
 * 道路設定ファイル
 *
 * 【重要】このファイルが「道の真実の源泉（Single Source of Truth）」です
 *
 * - 道のイラスト差し替えはここで行う
 * - 座標はすべてここを基準にする
 * - 店舗配置もこの座標を参照する
 */

export interface RoadConfig {
  type: 'placeholder' | 'illustration' | 'custom';
  imagePath?: string;        // カスタムイラストのパス
  bounds: [[number, number], [number, number]]; // 表示範囲（緯度経度）
  opacity?: number;          // 透明度
  zIndex?: number;           // レイヤー順序
  centerLine: number;        // 道の中心線（経度）
  widthOffset: number;       // 道幅の半分（経度差分）
}

/**
 * 日曜市の道路設定
 *
 * 【座標の意味】
 * - bounds: 道路が表示される範囲（緯度経度）
 * - 北西端（高知城前）から南東端（追手筋東端）まで約1.3km
 * - centerLine: 道路の中心線（店舗配置の基準）
 * - widthOffset: 道路の北側/南側のオフセット（動的計算）
 *
 * 【イラスト差し替え方法】
 * 1. SVGまたは画像ファイルを public/images/maps/ に配置
 * 2. type を 'custom' に変更
 * 3. imagePath にファイルパスを指定
 *
 * 例:
 * ```
 * type: 'custom',
 * imagePath: '/images/maps/sunday-market-road.svg',
 * ```
 *
 * 【動的間隔計算】
 * widthOffset は getRoadWidthOffset() 関数で動的に計算されます
 * - displayConfig.ts の SPACING_CONFIG.roadWidthOffsetRatio を使用
 * - 道路の長さに対する比率として計算（将来の変更に対応）
 */
export const ROAD_CONFIG: RoadConfig = {
  // 現在はプレースホルダー（仮の道）を使用
  // 実際の道のイラストができたら type: 'custom' に変更
  type: 'placeholder',

  // 道の表示範囲（実際の日曜市開催範囲）
  bounds: [
    [33.56500, 133.53200], // 北西端（高知城前）
    [33.55330, 133.53000], // 南東端（追手筋東端）
  ],

  // 道の中心線（店舗配置の基準線）
  centerLine: 133.53100,

  // 道幅の半分（北側/南側のオフセット）
  // 【注意】この値は後方互換性のため残していますが、
  // getRoadWidthOffset() 関数で動的に計算した値を使用することを推奨
  widthOffset: 0.0006,

  // 表示設定
  opacity: 0.9,
  zIndex: 50, // 背景より上、店舗より下
};

/**
 * 道の範囲を取得（他のモジュールから参照用）
 */
export function getRoadBounds(): [[number, number], [number, number]] {
  return ROAD_CONFIG.bounds;
}

/**
 * 道の中心線を取得（店舗配置用）
 */
export function getRoadCenterLine(): number {
  return ROAD_CONFIG.centerLine;
}

/**
 * 道幅オフセットを取得（店舗配置用）
 *
 * 【動的計算】
 * - displayConfig から比率を取得して動的に計算
 * - 道路の長さが変わっても自動的に適切な間隔になる
 *
 * @param useDynamic 動的計算を使用するか（デフォルト: false、後方互換性のため）
 * @returns 道幅オフセット（経度）
 */
export function getRoadWidthOffset(useDynamic: boolean = false): number {
  if (!useDynamic) {
    // 後方互換性: 既存の固定値を返す
    return ROAD_CONFIG.widthOffset;
  }

  // 動的計算: 道路の長さに対する比率で計算
  // displayConfig をここで import すると循環依存になる可能性があるため、
  // 現時点では固定値を返す（将来の拡張用）
  // TODO: displayConfig の SPACING_CONFIG.roadWidthOffsetRatio を使用
  const roadLengthDegrees = Math.abs(
    ROAD_CONFIG.bounds[0][0] - ROAD_CONFIG.bounds[1][0]
  );
  const ratio = 0.038; // SPACING_CONFIG.roadWidthOffsetRatio と同期
  return roadLengthDegrees * ratio;
}

/**
 * 道の長さを計算（km）
 */
export function getRoadLength(): number {
  const [start, end] = ROAD_CONFIG.bounds;
  const latDiff = Math.abs(start[0] - end[0]);
  // 1度 ≈ 111km
  return latDiff * 111;
}
