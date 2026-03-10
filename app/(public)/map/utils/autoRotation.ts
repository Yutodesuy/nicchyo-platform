import L from "leaflet";
const ROAD_ROTATION_BREAK_LNG = 133.5414795;
const EAST_ROTATION_DEG = 90;
const WEST_ROTATION_DEG = 105;

export function normalizeRotationDeg(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
}

export function getShortestAngleDelta(fromDeg: number, toDeg: number): number {
  return normalizeRotationDeg(toDeg - fromDeg);
}

export function getAutoRotationForVisibleRoad({
  center,
}: {
  center: L.LatLng;
}): number | null {
  const rotationDeg =
    center.lng >= ROAD_ROTATION_BREAK_LNG ? EAST_ROTATION_DEG : WEST_ROTATION_DEG;
  return normalizeRotationDeg(rotationDeg);
}
