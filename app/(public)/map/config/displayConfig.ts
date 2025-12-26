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
 * ズームレベルに応じたイラストのスケール係数を取得
 *
 * 【連続的スケーリング】背景の拡大・縮小に合わせてイラストも自然にスケール
 *
 * 【目的】
 * - 「背景だけ拡大され、イラストが置いていかれる」違和感をなくす
 * - ズームレベルに連動した滑らかなサイズ変化
 * - スマホでの直感的な操作感を実現
 *
 * 【設計根拠】
 * - 基準: ズーム18.0でスケール1.0（ベースサイズそのまま）
 * - ズーム1段階（±1.0）でスケール±0.18程度の変化
 * - 範囲: 0.64（ズーム16.0）〜 1.36（ズーム20.0）
 * - 急激な変化を避け、自然な拡大・縮小を実現
 *
 * @param currentZoom 現在のズームレベル
 * @returns スケール係数（0.64 〜 1.36程度）
 */
export function getIllustrationScaleForZoom(currentZoom: number): number {
  // 基準ズーム: 18.0でスケール1.0
  const baseZoom = 18.0;
  const baseScale = 1.0;

  // ズーム1段階あたりのスケール変化率
  // 0.18 = ズーム1.0で約18%の変化（控えめで自然）
  const scalePerZoom = 0.18;

  // 線形補間でスケール計算
  const scale = baseScale + (currentZoom - baseZoom) * scalePerZoom;

  // 安全範囲: 0.5 〜 1.8（極端な縮小・拡大を防ぐ）
  return Math.max(0.5, Math.min(1.8, scale));
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
  // 【スマホUX改善】道幅を狭くして店舗を主役に
  // - 従来: 1.3km の道路に対して 50m ≈ 0.038 (3.8%)
  // - 改善後: 1.3km の道路に対して 33m ≈ 0.025 (2.5%)
  roadWidthOffsetRatio: 0.025,
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
 * 【スマホUX根本改善】連続的スケーリング × 最適間隔で自然な操作感
 *
 * ┌─────────────────────────────────────┐
 * │ OVERVIEW（16.0-18.0）幅2.0         │
 * │ 役割：全体俯瞰                      │
 * │ 体験：「日曜市のどこに何があるか把握」│
 * │ 表示：5-6店舗（1.7-2%）            │
 * │ イラスト：連続的スケール（縮小）   │
 * └─────────────────────────────────────┘
 * ┌─────────────────────────────────────┐
 * │ INTERMEDIATE（18.0-19.0）幅1.0     │
 * │ 役割：エリア探索（デフォルト）      │
 * │ 体験：「店舗配置が明確、重なりゼロ」│
 * │ 表示：7-10店舗（2.5-3%）           │
 * │ イラスト：連続的スケール（基準）   │
 * └─────────────────────────────────────┘
 * ┌─────────────────────────────────────┐
 * │ DETAIL（19.0以上）                 │
 * │ 役割：詳細閲覧                      │
 * │ 体験：「画面横幅に6-8店舗、快適」   │
 * │ 表示：17-25店舗（6-8%）            │
 * │ イラスト：連続的スケール（拡大）   │
 * └─────────────────────────────────────┘
 *
 * 【設計原則】
 * - 連続的スケーリング：背景と一緒にイラストも自然に拡大・縮小
 * - デフォルトズーム18.0：「今どこにいるか」が直感的に分かる
 * - 最適間隔：拡大・縮小どちらでも重ならない根本的な間隔設計
 * - スマホファースト：画面横幅に6-8店舗が収まる快適な密度
 */
export const VIEW_MODE_CONFIGS: ViewModeConfig[] = [
  {
    mode: ViewMode.DETAIL,
    minZoom: 19.0,  // 【スマホUX】19.0（詳細閲覧に適したズーム）
    filterInterval: 12,  // 【根本改善】10 → 12（25店舗 = 8%、画面に6-8店舗）
    mobileFilterInterval: 18,  // 【根本改善】15 → 18（17店舗 = 6%、快適な間隔）
    allowShopDetails: true,
    allowMarkerInteraction: true,
    description: '詳細閲覧 - 大きく見やすいイラスト、画面横幅に6-8店舗',
  },
  {
    mode: ViewMode.INTERMEDIATE,
    minZoom: 18.0,  // 【スマホUX】18.0（エリア探索、デフォルト表示）
    filterInterval: 30,  // 【根本改善】25 → 30（10店舗 = 3%、重なり完全防止）
    mobileFilterInterval: 40,  // 【根本改善】35 → 40（7-8店舗 = 2.5%、超快適）
    allowShopDetails: false,
    allowMarkerInteraction: true,
    description: 'エリア探索 - デフォルト表示、店舗配置が明確、重なりゼロ',
  },
  {
    mode: ViewMode.OVERVIEW,
    minZoom: 16.0,  // 【スマホUX】16.0（全体俯瞰、MIN_ZOOMと一致）
    filterInterval: 50,  // 【根本改善】40 → 50（6店舗 = 2%、超シンプル）
    mobileFilterInterval: 60,  // 【根本改善】50 → 60（5店舗 = 1.7%、最小限）
    allowShopDetails: false,
    allowMarkerInteraction: true,
    description: '全体俯瞰 - 日曜市全体の配置把握、最小限の店舗表示',
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
