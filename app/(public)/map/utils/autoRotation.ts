import L from "leaflet";
import type { MapRoutePoint } from "../types/mapRoute";
import { getRoadCenterlinePoints } from "../config/roadConfig";
import { normalizeMapRoutePoints } from "./mapRouteGeometry";

export function normalizeRotationDeg(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
}

export function getShortestAngleDelta(fromDeg: number, toDeg: number): number {
  return normalizeRotationDeg(toDeg - fromDeg);
}

export function getNearestRoadAlignedRotation(
  currentDeg: number,
  targetDeg: number
): { rotation: number; delta: number } {
  const normalizedTarget = normalizeRotationDeg(targetDeg);
  const oppositeTarget = normalizeRotationDeg(normalizedTarget + 180);

  const directDelta = getShortestAngleDelta(currentDeg, normalizedTarget);
  const oppositeDelta = getShortestAngleDelta(currentDeg, oppositeTarget);

  if (Math.abs(oppositeDelta) < Math.abs(directDelta)) {
    return { rotation: oppositeTarget, delta: oppositeDelta };
  }

  return { rotation: normalizedTarget, delta: directDelta };
}

export function getAutoRotationForVisibleRoad({
  center,
  routePoints,
}: {
  center: L.LatLng;
  routePoints?: MapRoutePoint[];
}): number | null {
  const points = normalizeMapRoutePoints(routePoints ?? []);
  const activePoints = points.length >= 2 ? points : getRoadCenterlinePoints();
  if (activePoints.length < 2) {
    return null;
  }

  let bestSegmentIndex = 0;
  let bestDistanceSq = Number.POSITIVE_INFINITY;

  for (let i = 0; i < activePoints.length - 1; i += 1) {
    const candidate = projectPointOntoSegment(center, activePoints[i], activePoints[i + 1]);
    const distanceSq =
      (candidate.lat - center.lat) * (candidate.lat - center.lat) +
      (candidate.lng - center.lng) * (candidate.lng - center.lng);

    if (distanceSq < bestDistanceSq) {
      bestDistanceSq = distanceSq;
      bestSegmentIndex = i;
    }
  }

  const from = activePoints[bestSegmentIndex];
  const to = activePoints[bestSegmentIndex + 1];
  const screenAngleDeg =
    (Math.atan2(-(to.lat - from.lat), to.lng - from.lng) * 180) / Math.PI;

  return normalizeRotationDeg(270 - screenAngleDeg);
}

function projectPointOntoSegment(
  point: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const abLat = b.lat - a.lat;
  const abLng = b.lng - a.lng;
  const abLenSq = abLat * abLat + abLng * abLng;

  if (abLenSq === 0) {
    return a;
  }

  const apLat = point.lat - a.lat;
  const apLng = point.lng - a.lng;
  const rawT = (apLat * abLat + apLng * abLng) / abLenSq;
  const t = Math.max(0, Math.min(1, rawT));

  return {
    lat: a.lat + abLat * t,
    lng: a.lng + abLng * t,
  };
}
