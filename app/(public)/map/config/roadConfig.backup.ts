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
  // 【スマホUX改善】道幅を狭くして店舗を主役に
  // - 従来: 0.0006（やや広め）
  // - 改善後: 0.0004（店舗イラストが引き立つ適度な幅）
  widthOffset: 0.0004,

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
  // 【スマホUX改善】道幅比率を縮小（0.038 → 0.025）
  const roadLengthDegrees = Math.abs(
    ROAD_CONFIG.bounds[0][0] - ROAD_CONFIG.bounds[1][0]
  );
  const ratio = 0.025; // 【改善】0.038 → 0.025（道を狭くして店舗を主役に）
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

/**
 * 日曜市エリアの境界（maxBounds用）
 * パン操作の制限範囲を定義
 *
 * 【目的】
 * - ユーザーが日曜市エリア外へパン（移動）できないようにする
 * - Leaflet の maxBounds パラメータで使用
 *
 * 【マージンの設計】
 * - 道路範囲に適度なマージンを追加（視認性のため）
 * - marginLat: 0.002 ≈ 約200m（緯度方向）
 * - marginLng: 0.001 ≈ 約100m（経度方向）
 *
 * @returns マップの境界 [[北西], [南東]]
 */
export function getSundayMarketBounds(): [[number, number], [number, number]] {
  const bounds = ROAD_CONFIG.bounds;

  // 道路範囲に適度なマージンを追加（視認性のため）
  const marginLat = 0.002;  // 約200m
  const marginLng = 0.001;  // 約100m

  return [
    [bounds[0][0] + marginLat, bounds[0][1] + marginLng],  // 北西
    [bounds[1][0] - marginLat, bounds[1][1] - marginLng],  // 南東
  ];
}

/**
 * ズーム範囲の適切な設定を取得
 *
 * 【目的】
 * - 日曜市マップに最適なズーム範囲を提供
 * - ユーザーエクスペリエンスの向上
 * - 過剰な縮小を防止し、「意味のある範囲」に制限
 *
 * 【ズーム範囲の設計根拠】
 * - min: 16 - 日曜市全体が把握できる程度を上限とし、過剰な俯瞰を防止
 *   （従来の14は縮小されすぎて意味のない状態になっていた）
 * - max: 20 - これ以上寄ると個別店舗の画像が荒れる
 *
 * 【構造改善】
 * - ズーム範囲を狭めることで、「常に気持ちよく見えるマップ」を実現
 * - 物理座標は変更できないため、視覚的な設計で間隔を確保
 *
 * @returns ズーム範囲 { min, max }
 */
export function getRecommendedZoomBounds(): { min: number; max: number } {
  return {
    min: 16,   // 【構造改善】過剰な縮小を防止（14→16）
    max: 20,   // これ以上寄ると個別店舗の画像が荒れる
  };
}
