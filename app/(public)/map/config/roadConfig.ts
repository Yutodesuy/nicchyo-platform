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
  type: 'placeholder',
  bounds: [
    [33.56500, 133.53125],
    [33.55330, 133.53075],
  ],
  centerLine: 133.53100,
  widthOffset: 0.0001,
  opacity: 0.9,
  zIndex: 50,
  segments: [
    {
      name: 'Sixth',
      bounds: [
        [33.56500, 133.53150],
        [33.56333, 133.53050],
      ],
      centerLine: 133.53100,
    },
    {
      name: 'Fifth',
      bounds: [
        [33.56333, 133.53170],
        [33.56166, 133.53070],
      ],
      centerLine: 133.53120,
    },
    {
      name: 'Fourth',
      bounds: [
        [33.56166, 133.53180],
        [33.55999, 133.53080],
      ],
      centerLine: 133.53130,
    },
    {
      name: 'Third',
      bounds: [
        [33.55999, 133.53170],
        [33.55832, 133.53070],
      ],
      centerLine: 133.53120,
    },
    {
      name: 'Second',
      bounds: [
        [33.55832, 133.53150],
        [33.55665, 133.53050],
      ],
      centerLine: 133.53100,
    },
    {
      name: 'First',
      bounds: [
        [33.55665, 133.53130],
        [33.55500, 133.53030],
      ],
      centerLine: 133.53080,
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

  // 実際の経度（西→東）をイラストの緯度（上→下）に変換
  // 西（経度小）= 上（緯度大）、東（経度大）= 下（緯度小）
  const lngRatio = (realLng - real.west) / (real.east - real.west);
  const illustLat = illustNorth - lngRatio * (illustNorth - illustSouth);

  // 実際の緯度（南→北）をイラストの経度（左→右）に変換
  // 南（緯度小）= 左（経度小）、北（緯度大）= 右（経度大）
  const latRatio = (realLat - real.south) / (real.north - real.south);
  const illustLng = illustWest + latRatio * (illustEast - illustWest);

  return { lat: illustLat, lng: illustLng };
}

export function getRoadCenterLine(): number {
  return (ROAD_CONFIG.bounds[0][1] + ROAD_CONFIG.bounds[1][1]) / 2;
}

export function getRoadWidthOffset(useDynamic: boolean = false): number {
  if (!useDynamic) {
    return ROAD_CONFIG.widthOffset;
  }

  const roadLengthDegrees = Math.abs(
    ROAD_CONFIG.bounds[0][0] - ROAD_CONFIG.bounds[1][0]
  );
  const ratio = 0.038;
  return roadLengthDegrees * ratio;
}

export function getRoadLength(): number {
  const [start, end] = ROAD_CONFIG.bounds;
  const latDiff = Math.abs(start[0] - end[0]);
  return latDiff * 111;
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
