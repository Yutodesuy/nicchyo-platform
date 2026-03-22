import { ROAD_CONFIG, getRoadCenterlinePoints } from "../config/roadConfig";
import {
  DEFAULT_MAP_ROUTE_CONFIG,
  type MapRouteConfig,
  type MapRoutePoint,
} from "../types/mapRoute";

export type RouteProjection = {
  point: { lat: number; lng: number };
  distanceMeters: number;
  segmentIndex: number;
  t: number;
};

export type RouteSegment = {
  key: string;
  start: MapRoutePoint;
  end: MapRoutePoint;
  isBranch: boolean;
};

export function getDefaultMapRoutePoints(): MapRoutePoint[] {
  return getRoadCenterlinePoints().map((point, index) => ({
    id: `default-route-point-${index + 1}`,
    lat: point.lat,
    lng: point.lng,
    order: index,
    branchFromId: null,
  }));
}

export function getDefaultMapRouteConfig(): MapRouteConfig {
  return {
    ...DEFAULT_MAP_ROUTE_CONFIG,
    roadHalfWidthMeters: DEFAULT_MAP_ROUTE_CONFIG.roadHalfWidthMeters,
  };
}

export function normalizeMapRoutePoints(points: MapRoutePoint[]): MapRoutePoint[] {
  return [...points]
    .filter(
      (point) =>
        point &&
        typeof point.id === "string" &&
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng)
    )
    .map((point) => ({
      ...point,
      branchFromId: point.branchFromId ?? null,
    }))
    .sort((a, b) => {
      const branchRankA = a.branchFromId ? 1 : 0;
      const branchRankB = b.branchFromId ? 1 : 0;
      if (branchRankA !== branchRankB) {
        return branchRankA - branchRankB;
      }
      return a.order - b.order;
    })
    .map((point, index) => ({
      ...point,
      order: index,
    }));
}

export function getMainRoutePoints(points: MapRoutePoint[]): MapRoutePoint[] {
  return normalizeMapRoutePoints(points).filter((point) => !point.branchFromId);
}

export function getBranchRoutePoints(points: MapRoutePoint[]): MapRoutePoint[] {
  return normalizeMapRoutePoints(points).filter((point) => Boolean(point.branchFromId));
}

export function getRouteSegments(points: MapRoutePoint[]): RouteSegment[] {
  const normalized = normalizeMapRoutePoints(points);
  const mainline = normalized.filter((point) => !point.branchFromId);
  const pointById = new Map(normalized.map((point) => [point.id, point]));
  const segments: RouteSegment[] = [];

  for (let index = 0; index < mainline.length - 1; index += 1) {
    segments.push({
      key: `main-${mainline[index].id}-${mainline[index + 1].id}`,
      start: mainline[index],
      end: mainline[index + 1],
      isBranch: false,
    });
  }

  normalized
    .filter((point) => point.branchFromId)
    .forEach((point) => {
      const parent = pointById.get(point.branchFromId ?? "");
      if (!parent) return;
      segments.push({
        key: `branch-${parent.id}-${point.id}`,
        start: parent,
        end: point,
        isBranch: true,
      });
    });

  return segments;
}

export function getEffectiveMapRouteConfig(
  config?: Partial<MapRouteConfig> | null
): MapRouteConfig {
  return {
    ...getDefaultMapRouteConfig(),
    ...(config ?? {}),
    key: config?.key ?? DEFAULT_MAP_ROUTE_CONFIG.key,
  };
}

export function getRouteBounds(
  points: Array<{ lat: number; lng: number }>,
  fallback: [[number, number], [number, number]] = ROAD_CONFIG.bounds
): [[number, number], [number, number]] {
  if (points.length === 0) {
    return fallback;
  }

  let north = Number.NEGATIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let west = Number.POSITIVE_INFINITY;

  for (const point of points) {
    north = Math.max(north, point.lat);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lng);
    west = Math.min(west, point.lng);
  }

  return [
    [north, east],
    [south, west],
  ];
}

export function expandBoundsByMeters(
  bounds: [[number, number], [number, number]],
  paddingMeters: number
): [[number, number], [number, number]] {
  const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
  const latPad = metersToLat(paddingMeters);
  const lngPad = metersToLng(paddingMeters, centerLat);
  return [
    [bounds[0][0] + latPad, bounds[0][1] + lngPad],
    [bounds[1][0] - latPad, bounds[1][1] - lngPad],
  ];
}

export function getRouteCenter(
  points: Array<{ lat: number; lng: number }>,
  fallbackBounds: [[number, number], [number, number]] = ROAD_CONFIG.bounds
): [number, number] {
  const bounds = getRouteBounds(points, fallbackBounds);
  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ];
}

export function densifyPath(
  points: Array<{ lat: number; lng: number }>,
  stepMeters: number
): Array<[number, number]> {
  if (points.length < 2) {
    return points.map((p) => [p.lat, p.lng]);
  }

  const dense: Array<[number, number]> = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const dist = distanceMeters(a, b);
    const steps = Math.max(1, Math.ceil(dist / stepMeters));
    for (let k = 0; k < steps; k += 1) {
      const t = k / steps;
      dense.push([a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t]);
    }
  }
  const last = points[points.length - 1];
  dense.push([last.lat, last.lng]);
  return dense;
}

export function smoothPath(path: Array<[number, number]>, radius: number): Array<[number, number]> {
  if (path.length < 3 || radius <= 0) return path;
  return path.map((_, idx) => {
    const start = Math.max(0, idx - radius);
    const end = Math.min(path.length - 1, idx + radius);
    let sumLat = 0;
    let sumLng = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      sumLat += path[i][0];
      sumLng += path[i][1];
      count += 1;
    }
    return [sumLat / count, sumLng / count];
  });
}

export function buildRoadPolygon(
  centerline: Array<[number, number]>,
  halfWidthMeters: number
): Array<[number, number]> {
  if (centerline.length < 2) return [];

  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  for (let i = 0; i < centerline.length; i += 1) {
    const prev = centerline[Math.max(0, i - 1)];
    const next = centerline[Math.min(centerline.length - 1, i + 1)];
    const curr = centerline[i];
    const tangent = tangentVectorMeters(prev, next, curr[0]);
    const len = Math.hypot(tangent.x, tangent.y) || 1;
    const nx = -tangent.y / len;
    const ny = tangent.x / len;

    const dLat = metersToLat(ny * halfWidthMeters);
    const dLng = metersToLng(nx * halfWidthMeters, curr[0]);
    left.push([curr[0] + dLat, curr[1] + dLng]);
    right.push([curr[0] - dLat, curr[1] - dLng]);
  }

  return [...left, ...right.reverse()];
}

export function projectPointOntoRoute(
  point: { lat: number; lng: number },
  routePoints: MapRoutePoint[]
): RouteProjection | null {
  const segments = getRouteSegments(routePoints);

  if (routePoints.length === 0) {
    return null;
  }

  if (segments.length === 0 && routePoints.length === 1) {
    return {
      point: { lat: routePoints[0].lat, lng: routePoints[0].lng },
      distanceMeters: distanceMeters(point, routePoints[0]),
      segmentIndex: 0,
      t: 0,
    };
  }

  let bestProjection: RouteProjection | null = null;

  for (let i = 0; i < segments.length; i += 1) {
    const projection = projectPointOntoSegment(point, segments[i].start, segments[i].end);
    const nextProjection: RouteProjection = {
      point: projection.point,
      distanceMeters: distanceMeters(point, projection.point),
      segmentIndex: i,
      t: projection.t,
    };

    if (!bestProjection || nextProjection.distanceMeters < bestProjection.distanceMeters) {
      bestProjection = nextProjection;
    }
  }

  return bestProjection;
}

export function getRouteLengthKm(points: Array<{ lat: number; lng: number }>): number {
  if (points.length < 2) {
    const bounds = ROAD_CONFIG.bounds;
    return Math.max(
      Math.abs(bounds[0][0] - bounds[1][0]),
      Math.abs(bounds[0][1] - bounds[1][1])
    ) * 111;
  }

  let meters = 0;
  const routeSegments = getRouteSegments(points as MapRoutePoint[]);
  for (const segment of routeSegments) {
    meters += distanceMeters(segment.start, segment.end);
  }
  return meters / 1000;
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = latToMeters(b.lat - a.lat);
  const dLng = lngToMeters(b.lng - a.lng, (a.lat + b.lat) / 2);
  return Math.hypot(dLat, dLng);
}

export function latToMeters(latDiff: number): number {
  return latDiff * 110540;
}

export function lngToMeters(lngDiff: number, lat: number): number {
  return lngDiff * (111320 * Math.cos((lat * Math.PI) / 180));
}

export function metersToLat(meters: number): number {
  return meters / 110540;
}

export function metersToLng(meters: number, lat: number): number {
  const unit = 111320 * Math.cos((lat * Math.PI) / 180);
  if (Math.abs(unit) < 1e-6) return 0;
  return meters / unit;
}

function tangentVectorMeters(
  prev: [number, number],
  next: [number, number],
  latRef: number
): { x: number; y: number } {
  const dLng = next[1] - prev[1];
  const dLat = next[0] - prev[0];
  return {
    x: lngToMeters(dLng, latRef),
    y: latToMeters(dLat),
  };
}

function projectPointOntoSegment(
  point: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): { point: { lat: number; lng: number }; t: number } {
  const abLat = b.lat - a.lat;
  const abLng = b.lng - a.lng;
  const abLenSq = abLat * abLat + abLng * abLng;

  if (abLenSq === 0) {
    return {
      point: { lat: a.lat, lng: a.lng },
      t: 0,
    };
  }

  const apLat = point.lat - a.lat;
  const apLng = point.lng - a.lng;
  const rawT = (apLat * abLat + apLng * abLng) / abLenSq;
  const t = Math.max(0, Math.min(1, rawT));

  return {
    point: {
      lat: a.lat + abLat * t,
      lng: a.lng + abLng * t,
    },
    t,
  };
}
