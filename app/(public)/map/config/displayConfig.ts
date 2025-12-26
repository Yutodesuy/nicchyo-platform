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
 *
 * 【スマホUX最適化】イラストサイズを拡大して視認性・タップ性を向上
 * - small: 35px → 45px（視認性向上、指でタップしやすい）
 * - medium: 50px → 60px（詳細が見やすい、快適なサイズ）
 * - filterIntervalで表示店舗数を減らし、適切な間隔を確保
 */
export const ILLUSTRATION_SIZES: Record<
  'small' | 'medium' | 'large',
  IllustrationSize
> = {
  small: {
    width: 45,    // 【スマホUX】35→45px（視認性・タップ性向上）
    height: 45,
    anchor: [22, 38], // 下部中央（サイズに合わせて調整）
    bubbleOffset: 28,
  },
  medium: {
    width: 60,    // 【スマホUX】50→60px（詳細が見やすい）
    height: 60,
    anchor: [30, 50], // 下部中央（サイズに合わせて調整）
    bubbleOffset: 36,
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
 * 【Phase 3.5】動的サイズ調整を優先的に使用（getIllustrationSizeForZoom）
 */
export const DEFAULT_ILLUSTRATION_SIZE: 'small' | 'medium' | 'large' =
  'medium';

/**
 * ズームレベルに応じたイラストサイズを動的に取得
 *
 * 【スマホUX最適化】VIEW_MODE と完全に同期、大きいイラストで視認性向上
 *
 * 【目的】
 * - スマホでの視認性・タップ性を最優先
 * - 段階的な情報開示（ズームインするほど詳細が見える）
 * - filterIntervalとの組み合わせで適切な間隔を確保
 *
 * 【設計根拠】
 * - ズーム19.0以上: medium (60px) - DETAIL モード（詳細閲覧、大きく見やすい）
 * - ズーム18.0-19.0: small (45px) - INTERMEDIATE モード（エリア探索、タップしやすい）
 * - ズーム18.0未満: small (45px) - OVERVIEW モード（全体俯瞰、見やすい）
 *
 * @param currentZoom 現在のズームレベル
 * @returns イラストサイズ ('small' | 'medium' | 'large')
 */
export function getIllustrationSizeForZoom(
  currentZoom: number
): 'small' | 'medium' | 'large' {
  if (currentZoom >= 19.0) {
    return 'medium'; // 【スマホUX】詳細閲覧: 60px（大きく見やすい）
  }
  if (currentZoom >= 18.0) {
    return 'small'; // 【スマホUX】エリア探索: 45px（タップしやすい）
  }
  return 'small'; // 全体俯瞰: 45px（視認性確保）
}

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

/**
 * レスポンシブスペーシング設定
 *
 * 【目的】
 * - デバイスサイズに応じた最適な店舗間隔を提供
 * - モバイル、タブレット、デスクトップで異なる密度を設定
 *
 * 【将来の拡張】
 * - Phase 3のクラスタリング実装で使用
 * - 店舗間隔の動的調整に活用
 */
export interface ResponsiveSpacingConfig {
  /** モバイル画面での最小ピクセル間隔（画面幅 < 768px） */
  mobile: number;
  /** タブレット画面での最小ピクセル間隔（画面幅 768-1023px） */
  tablet: number;
  /** デスクトップ画面での最小ピクセル間隔（画面幅 >= 1024px） */
  desktop: number;
}

export const RESPONSIVE_SPACING: ResponsiveSpacingConfig = {
  mobile: 60,   // モバイルは密集を避けるため広めに
  tablet: 80,   // タブレットは中間
  desktop: 100, // デスクトップは広く
};

/**
 * 画面サイズとズームレベルに応じた最適な店舗間隔を取得
 *
 * 【計算ロジック】
 * 1. 画面幅に応じたベース間隔を決定
 * 2. ズームレベルに応じた補正係数を適用
 *    - ズーム17を基準（係数1.0）
 *    - 1ズーム上がるごとに2倍、下がるごとに0.5倍
 *
 * @param screenWidth 画面幅（px）
 * @param currentZoom 現在のズームレベル
 * @returns 最適な店舗間ピクセル間隔
 */
export function getOptimalSpacing(
  screenWidth: number,
  currentZoom: number
): number {
  // 画面サイズに応じたベース間隔
  let baseSpacing: number;
  if (screenWidth < 768) {
    baseSpacing = RESPONSIVE_SPACING.mobile;
  } else if (screenWidth < 1024) {
    baseSpacing = RESPONSIVE_SPACING.tablet;
  } else {
    baseSpacing = RESPONSIVE_SPACING.desktop;
  }

  // ズームレベルに応じた補正
  // ズーム17を基準（係数1.0）として、1ズーム上がるごとに2倍、下がるごとに0.5倍
  const zoomFactor = Math.pow(2, currentZoom - 17);

  return baseSpacing * zoomFactor;
}

/**
 * マップの表示モード（Phase 3）
 * Googleマップライクな段階的表示を実現
 */
export enum ViewMode {
  /** 俯瞰モード: 店舗アイコンのみ、詳細情報表示禁止 */
  OVERVIEW = 'OVERVIEW',

  /** 中間モード: 店舗アイコン、タップで自然ズームアップ */
  INTERMEDIATE = 'INTERMEDIATE',

  /** 詳細モード: 詳細バナー表示可能 */
  DETAIL = 'DETAIL',
}

/**
 * 表示モード定義
 *
 * 【Phase 3.5】スマホファースト対応
 * - mobileFilterInterval: スマホ専用の間引き間隔（画面が小さいため、より積極的に間引く）
 */
export interface ViewModeConfig {
  mode: ViewMode;
  minZoom: number;
  filterInterval: number;          // デスクトップ/タブレット用の間引き間隔
  mobileFilterInterval?: number;   // スマホ専用の間引き間隔（未指定時は filterInterval を使用）
  allowShopDetails: boolean;       // 詳細バナー表示を許可
  allowMarkerInteraction: boolean; // マーカークリックを許可
  description: string;
}

/**
 * 表示モード設定（ズームレベルから決定）
 *
 * 【スマホUX最適化】大きいイラスト × 適切な間隔で快適な操作感
 *
 * ┌─────────────────────────────────────┐
 * │ OVERVIEW（16.0-18.0）幅2.0         │
 * │ 役割：全体俯瞰                      │
 * │ 体験：「日曜市のどこに何があるか把握」│
 * │ 表示：6-8店舗（2-2.5%）            │
 * │ イラスト：45px（見やすい）         │
 * └─────────────────────────────────────┘
 * ┌─────────────────────────────────────┐
 * │ INTERMEDIATE（18.0-19.0）幅1.0     │
 * │ 役割：エリア探索                    │
 * │ 体験：「店舗配置が明確」            │
 * │ 表示：8-12店舗（3-4%）             │
 * │ イラスト：45px（タップしやすい）   │
 * └─────────────────────────────────────┘
 * ┌─────────────────────────────────────┐
 * │ DETAIL（19.0以上）                 │
 * │ 役割：詳細閲覧                      │
 * │ 体験：「大きく見やすい詳細情報」    │
 * │ 表示：15-20店舗（5-7%）            │
 * │ イラスト：60px（最大）             │
 * └─────────────────────────────────────┘
 *
 * 【設計原則】
 * - イラストサイズ拡大（45px/60px）で視認性・タップ性向上
 * - filterInterval大幅増加で適切な間隔確保（重なり防止）
 * - 画面横幅に4-6店舗が収まる最適密度
 * - スマホファースト：指での操作を最優先
 */
export const VIEW_MODE_CONFIGS: ViewModeConfig[] = [
  {
    mode: ViewMode.DETAIL,
    minZoom: 19.0,  // 【スマホUX】18.5 → 19.0（より拡大して詳細表示）
    filterInterval: 10,  // 【スマホUX】5 → 10（30店舗 = 10%、適切な間隔）
    mobileFilterInterval: 15,  // 【スマホUX】8 → 15（20店舗 = 7%、画面に4-6店舗）
    allowShopDetails: true,
    allowMarkerInteraction: true,
    description: '詳細閲覧 - 大きく見やすいイラスト60px、画面に4-6店舗程度',
  },
  {
    mode: ViewMode.INTERMEDIATE,
    minZoom: 18.0,  // 【スマホUX】17.5 → 18.0（段階を明確化）
    filterInterval: 25,  // 【スマホUX】15 → 25（12店舗 = 4%、明確な差）
    mobileFilterInterval: 35,  // 【スマホUX】20 → 35（8-9店舗 = 3%、疎ら）
    allowShopDetails: false,
    allowMarkerInteraction: true,
    description: 'エリア探索 - イラスト45px、店舗配置が明確、重なりなし',
  },
  {
    mode: ViewMode.OVERVIEW,
    minZoom: 16.0,  // 【スマホUX】16.0維持（全体俯瞰、MIN_ZOOMと一致）
    filterInterval: 40,  // 【スマホUX】30 → 40（7-8店舗 = 2.5%）
    mobileFilterInterval: 50,  // 【スマホUX】40 → 50（6店舗 = 2%、超シンプル）
    allowShopDetails: false,
    allowMarkerInteraction: true,
    description: '全体俯瞰 - イラスト45px、日曜市全体の配置把握',
  },
];

/**
 * ズームレベルから表示モードを取得
 */
export function getViewModeForZoom(currentZoom: number): ViewModeConfig {
  for (const config of VIEW_MODE_CONFIGS) {
    if (currentZoom >= config.minZoom) {
      return config;
    }
  }
  return VIEW_MODE_CONFIGS[VIEW_MODE_CONFIGS.length - 1];
}

/**
 * デバイスに応じた適切な filterInterval を取得
 *
 * 【Phase 3.5】スマホファースト対応
 * - スマホ: mobileFilterInterval を優先使用
 * - デスクトップ/タブレット: filterInterval を使用
 *
 * @param config 表示モード設定
 * @param isMobile スマホかどうか
 * @returns 適切な filterInterval
 */
export function getFilterIntervalForDevice(
  config: ViewModeConfig,
  isMobile: boolean
): number {
  if (isMobile && config.mobileFilterInterval !== undefined) {
    return config.mobileFilterInterval;
  }
  return config.filterInterval;
}

/**
 * 詳細バナーを表示できるかチェック
 */
export function canShowShopDetailBanner(currentZoom: number): boolean {
  const viewMode = getViewModeForZoom(currentZoom);
  return viewMode.allowShopDetails;
}

/**
 * 詳細表示可能な最小ズームレベルを取得
 */
export function getMinZoomForDetailMode(): number {
  const detailMode = VIEW_MODE_CONFIGS.find(
    (config) => config.mode === ViewMode.DETAIL
  );
  return detailMode?.minZoom ?? 17.0;
}
