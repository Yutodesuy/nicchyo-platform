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
    [33.56500, 133.53200],
    [33.55330, 133.53000],
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
  return getPaddedRoadBounds(0.02);
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
