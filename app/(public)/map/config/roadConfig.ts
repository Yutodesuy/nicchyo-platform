/**
 * Road config (single source of truth).
 */

export interface RoadSegment {
  name: string;
  bounds: [[number, number], [number, number]];
  centerLine: number;
}

export interface RoadConfig {
  type: 'placeholder' | 'illustration' | 'custom' | 'curved';
  imagePath?: string;
  bounds: [[number, number], [number, number]];
  opacity?: number;
  zIndex?: number;
  centerLine: number;
  widthOffset: number;
  segments?: RoadSegment[];
}

export const ROAD_CONFIG: RoadConfig = {
  type: 'curved',
  bounds: [
    // 追手筋の実座標（指定2区間）に合わせた範囲
    [33.56231, 133.5433256],
    [33.56047, 133.5336783],
  ],
  // 東西配置では中心緯度を基準線として扱う
  centerLine: 33.5614118,
  widthOffset: 0.0001,
  opacity: 0.9,
  zIndex: 50,
  segments: [
    {
      name: 'F0',
      bounds: [
        [33.5622728, 133.5433256],
        [33.5620328, 133.5429279],
      ],
      centerLine: 33.5621528,
    },
    {
      name: 'F1',
      bounds: [
        [33.5622728, 133.5429279],
        [33.5620328, 133.5423485],
      ],
      centerLine: 33.5621528,
    },
    {
      name: 'F2',
      bounds: [
        [33.5622728, 133.5423485],
        [33.5620328, 133.5417692],
      ],
      centerLine: 33.5621528,
    },
    {
      name: 'F3',
      bounds: [
        [33.5622728, 133.5417692],
        [33.5620328, 133.5411898],
      ],
      centerLine: 33.5621528,
    },
    {
      name: 'D1',
      bounds: [
        [33.5622106, 133.5411898],
        [33.5619706, 133.5401167],
      ],
      centerLine: 33.5620906,
    },
    {
      name: 'D2',
      bounds: [
        [33.5619843, 133.5401167],
        [33.5617443, 133.5390437],
      ],
      centerLine: 33.5618643,
    },
    {
      name: 'D3',
      bounds: [
        [33.5617581, 133.5390437],
        [33.5615181, 133.5379706],
      ],
      centerLine: 33.5616381,
    },
    {
      name: 'D4',
      bounds: [
        [33.5615318, 133.5379706],
        [33.5612918, 133.5368975],
      ],
      centerLine: 33.5614118,
    },
    {
      name: 'D5',
      bounds: [
        [33.5613055, 133.5368975],
        [33.5610655, 133.5358244],
      ],
      centerLine: 33.5611855,
    },
    {
      name: 'D6',
      bounds: [
        [33.5610793, 133.5358244],
        [33.5608393, 133.5347514],
      ],
      centerLine: 33.5609593,
    },
    {
      name: 'D7',
      bounds: [
        [33.5608530, 133.5347514],
        [33.5606130, 133.5336783],
      ],
      centerLine: 33.5607330,
    },
  ],
};

export function getRoadBounds(): [[number, number], [number, number]] {
  return ROAD_CONFIG.bounds;
}

/**
 * 日曜市エリア全体の範囲（位置判定用）
 * - 高知城前（西端）からスタート地点（東端）までをカバー
 * - UserLocationMarker と timeBadgeService で共通使用
 */
export const SUNDAY_MARKET_LOCATION_BOUNDS = {
  north: 33.5625,   // 実測データに基づく北端
  south: 33.5600,   // 実測データに基づく南端
  west: 133.5335,   // 高知城前（西端）
  east: 133.5430,   // スタート地点（東端）
} as const;

/**
 * 座標が日曜市エリア内かどうかを判定
 */
export function isInsideSundayMarket(lat: number, lng: number): boolean {
  return (
    lat >= SUNDAY_MARKET_LOCATION_BOUNDS.south &&
    lat <= SUNDAY_MARKET_LOCATION_BOUNDS.north &&
    lng >= SUNDAY_MARKET_LOCATION_BOUNDS.west &&
    lng <= SUNDAY_MARKET_LOCATION_BOUNDS.east
  );
}

/**
 * 実際のGPS座標を道路イラスト上の座標に変換
 *
 * 実際の日曜市は東西方向（経度方向）に伸びているが、
 * 道路イラストは南北方向（緯度方向）に描画されている。
 *
 * 変換ルール：
 * - 実際の経度（西→東）→ イラストの緯度（上→下）
 * - 実際の緯度（南→北）→ イラストの経度（左→右）
 */
export function convertGpsToIllustration(
  realLat: number,
  realLng: number
): { lat: number; lng: number } {
  const real = SUNDAY_MARKET_LOCATION_BOUNDS;
  const illust = ROAD_CONFIG.bounds;

  // イラストの範囲を正規化
  const illustNorth = Math.max(illust[0][0], illust[1][0]);
  const illustSouth = Math.min(illust[0][0], illust[1][0]);
  const illustEast = Math.max(illust[0][1], illust[1][1]);
  const illustWest = Math.min(illust[0][1], illust[1][1]);

  const realLatSpan = real.north - real.south;
  const realLngSpan = real.east - real.west;
  const illustLatSpan = illustNorth - illustSouth;
  const illustLngSpan = illustEast - illustWest;
  const realIsEastWest = realLngSpan > realLatSpan;
  const illustIsEastWest = illustLngSpan > illustLatSpan;

  let illustLat: number;
  let illustLng: number;
  if (realIsEastWest === illustIsEastWest) {
    const latRatio = (realLat - real.south) / realLatSpan;
    const lngRatio = (realLng - real.west) / realLngSpan;
    illustLat = illustSouth + latRatio * illustLatSpan;
    illustLng = illustWest + lngRatio * illustLngSpan;
  } else {
    // 実際の経度（西→東）をイラストの緯度（上→下）に変換
    const lngRatio = (realLng - real.west) / realLngSpan;
    illustLat = illustNorth - lngRatio * illustLatSpan;

    // 実際の緯度（南→北）をイラストの経度（左→右）に変換
    const latRatio = (realLat - real.south) / realLatSpan;
    illustLng = illustWest + latRatio * illustLngSpan;
  }

  return { lat: illustLat, lng: illustLng };
}

export function getRoadCenterLine(): number {
  const bounds = ROAD_CONFIG.bounds;
  const latSpan = Math.abs(bounds[0][0] - bounds[1][0]);
  const lngSpan = Math.abs(bounds[0][1] - bounds[1][1]);
  if (lngSpan > latSpan) {
    return (bounds[0][0] + bounds[1][0]) / 2;
  }
  return (bounds[0][1] + bounds[1][1]) / 2;
}

/**
 * イラスト座標を道路中央にスナップ
 * 緯度（縦位置）はそのまま、経度（横位置）を中央線に吸着
 */
export function snapToRoadCenter(
  illustLat: number,
  illustLng: number
): { lat: number; lng: number } {
  const bounds = ROAD_CONFIG.bounds;
  const latSpan = Math.abs(bounds[0][0] - bounds[1][0]);
  const lngSpan = Math.abs(bounds[0][1] - bounds[1][1]);
  const center = getRoadCenterLine();
  if (lngSpan > latSpan) {
    return {
      lat: center,
      lng: illustLng,
    };
  }
  return {
    lat: illustLat,
    lng: center,
  };
}

export function getRoadWidthOffset(useDynamic: boolean = false): number {
  if (!useDynamic) {
    return ROAD_CONFIG.widthOffset;
  }

  const latDiff = Math.abs(ROAD_CONFIG.bounds[0][0] - ROAD_CONFIG.bounds[1][0]);
  const lngDiff = Math.abs(ROAD_CONFIG.bounds[0][1] - ROAD_CONFIG.bounds[1][1]);
  const roadLengthDegrees = Math.max(latDiff, lngDiff);
  const ratio = 0.038;
  return roadLengthDegrees * ratio;
}

export function getRoadLength(): number {
  const [start, end] = ROAD_CONFIG.bounds;
  const latDiff = Math.abs(start[0] - end[0]);
  const lngDiff = Math.abs(start[1] - end[1]);
  return Math.max(latDiff, lngDiff) * 111;
}

export function getSundayMarketBounds(): [[number, number], [number, number]] {
  // NOTE: This expands beyond the Sunday market shop-only span for map panning.
  // Keep the shop-only bounds below for reference/data usage.
  // Shop-only bounds (road span):
  // [
  //   [33.56500, 133.53200],
  //   [33.55330, 133.53000],
  // ]
  return getExpandedRoadBounds({
    north: 0.0055,
    south: 0.003,
    west: 0.003,
    east: 0.0065,
  });
}

export function getRecommendedZoomBounds(): { min: number; max: number } {
  return { min: 15, max: 21 };
}

export function getPaddedRoadBounds(
  paddingRatio: number = 0.05
): [[number, number], [number, number]] {
  const bounds = ROAD_CONFIG.bounds;
  const latRange = Math.abs(bounds[0][0] - bounds[1][0]);
  const lngRange = Math.abs(bounds[0][1] - bounds[1][1]);
  const marginLat = latRange * paddingRatio;
  const marginLng = lngRange * paddingRatio;
  return [
    [bounds[0][0] + marginLat, bounds[0][1] + marginLng],
    [bounds[1][0] - marginLat, bounds[1][1] - marginLng],
  ];
}

export function getExpandedRoadBounds({
  north,
  south,
  west,
  east,
}: {
  north: number;
  south: number;
  west: number;
  east: number;
}): [[number, number], [number, number]] {
  const bounds = ROAD_CONFIG.bounds;
  const northLat = Math.max(bounds[0][0], bounds[1][0]) + north;
  const southLat = Math.min(bounds[0][0], bounds[1][0]) - south;
  const westLng = Math.min(bounds[0][1], bounds[1][1]) - west;
  const eastLng = Math.max(bounds[0][1], bounds[1][1]) + east;
  return [
    [northLat, eastLng],
    [southLat, westLng],
  ];
}
