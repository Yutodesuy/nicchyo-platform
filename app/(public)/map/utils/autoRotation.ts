import L from "leaflet";
import { ROAD_CONFIG } from "../config/roadConfig";

const MIN_VARIANCE = 1e-10;
const VISIBLE_PADDING_RATIO = 0.2;

type RotationPoint = {
  x: number;
  y: number;
  weight: number;
};

function projectPoint(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
): { x: number; y: number } {
  const latScale = 111320;
  const lngScale = Math.cos((centerLat * Math.PI) / 180) * 111320;
  return {
    x: (lng - centerLng) * lngScale,
    y: (lat - centerLat) * latScale,
  };
}

function getPrincipalAxisAngleDeg(points: RotationPoint[]): number | null {
  const weightSum = points.reduce((sum, point) => sum + point.weight, 0);
  if (weightSum <= 0) return null;

  const meanX =
    points.reduce((sum, point) => sum + point.x * point.weight, 0) / weightSum;
  const meanY =
    points.reduce((sum, point) => sum + point.y * point.weight, 0) / weightSum;

  let covXX = 0;
  let covYY = 0;
  let covXY = 0;
  points.forEach((point) => {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    covXX += point.weight * dx * dx;
    covYY += point.weight * dy * dy;
    covXY += point.weight * dx * dy;
  });

  covXX /= weightSum;
  covYY /= weightSum;
  covXY /= weightSum;

  const trace = covXX + covYY;
  const determinant = covXX * covYY - covXY * covXY;
  const discriminant = Math.max(0, (trace * trace) / 4 - determinant);
  const lambda = trace / 2 + Math.sqrt(discriminant);
  const axisX = covXY;
  const axisY = lambda - covXX;

  const varianceGap = Math.abs(lambda - (trace - lambda));
  if (varianceGap < MIN_VARIANCE) return null;

  if (Math.abs(axisX) < MIN_VARIANCE && Math.abs(axisY) < MIN_VARIANCE) {
    return null;
  }

  return (Math.atan2(axisY, axisX) * 180) / Math.PI;
}

function getRoadAnchorPoints(): Array<{ lat: number; lng: number }> {
  if (ROAD_CONFIG.type !== "curved" || !ROAD_CONFIG.segments?.length) {
    const [start, end] = ROAD_CONFIG.bounds;
    return [
      { lat: start[0], lng: start[1] },
      { lat: end[0], lng: end[1] },
    ];
  }

  const latSpan = Math.abs(ROAD_CONFIG.bounds[0][0] - ROAD_CONFIG.bounds[1][0]);
  const lngSpan = Math.abs(ROAD_CONFIG.bounds[0][1] - ROAD_CONFIG.bounds[1][1]);
  const isEastWest = lngSpan > latSpan;

  return ROAD_CONFIG.segments
    .map((segment) => {
      const northLat = Math.max(segment.bounds[0][0], segment.bounds[1][0]);
      const southLat = Math.min(segment.bounds[0][0], segment.bounds[1][0]);
      const eastLng = Math.max(segment.bounds[0][1], segment.bounds[1][1]);
      const westLng = Math.min(segment.bounds[0][1], segment.bounds[1][1]);
      if (isEastWest) {
        return {
          lat: segment.centerLine ?? (northLat + southLat) / 2,
          lng: (eastLng + westLng) / 2,
        };
      }
      return {
        lat: (northLat + southLat) / 2,
        lng: segment.centerLine ?? (eastLng + westLng) / 2,
      };
    })
    .sort((a, b) => (isEastWest ? a.lng - b.lng : b.lat - a.lat));
}

function getExpandedBounds(bounds: L.LatLngBounds): L.LatLngBounds {
  const latPad =
    Math.abs(bounds.getNorth() - bounds.getSouth()) * VISIBLE_PADDING_RATIO;
  const lngPad = Math.abs(bounds.getEast() - bounds.getWest()) * VISIBLE_PADDING_RATIO;
  return L.latLngBounds(
    [bounds.getSouth() - latPad, bounds.getWest() - lngPad],
    [bounds.getNorth() + latPad, bounds.getEast() + lngPad]
  );
}

export function normalizeRotationDeg(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
}

export function getShortestAngleDelta(fromDeg: number, toDeg: number): number {
  return normalizeRotationDeg(toDeg - fromDeg);
}

export function getAutoRotationForVisibleRoad({
  bounds,
  center,
  currentRotation,
}: {
  bounds: L.LatLngBounds;
  center: L.LatLng;
  currentRotation: number;
}): number | null {
  const expandedBounds = getExpandedBounds(bounds);
  const anchorPoints = getRoadAnchorPoints();

  const visiblePoints = anchorPoints
    .filter((point) => expandedBounds.contains([point.lat, point.lng]))
    .map((point) => {
      const projected = projectPoint(point.lat, point.lng, center.lat, center.lng);
      const distance = Math.hypot(projected.x, projected.y);
      return {
        ...projected,
        weight: 1 / (1 + distance / 70),
      };
    });

  if (visiblePoints.length < 2) return null;

  const axisAngle = getPrincipalAxisAngleDeg(visiblePoints);
  if (axisAngle === null) return null;

  const verticalCandidates = [
    normalizeRotationDeg(90 - axisAngle),
    normalizeRotationDeg(-90 - axisAngle),
  ];

  return verticalCandidates.reduce((best, candidate) => {
    return Math.abs(getShortestAngleDelta(currentRotation, candidate)) <
      Math.abs(getShortestAngleDelta(currentRotation, best))
      ? candidate
      : best;
  }, verticalCandidates[0]);
}
