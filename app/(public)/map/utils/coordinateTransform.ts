export type LatLngTuple = [number, number];

export function createAxisSwapTransform(center: LatLngTuple) {
  const [centerLat, centerLng] = center;

  const toDisplayLatLng = (lat: number, lng: number): LatLngTuple => {
    const nextLat = centerLat - (lng - centerLng);
    const nextLng = centerLng + (lat - centerLat);
    return [nextLat, nextLng];
  };

  const toDisplayBounds = (
    bounds: [[number, number], [number, number]]
  ): [[number, number], [number, number]] => {
    const corners: LatLngTuple[] = [
      toDisplayLatLng(bounds[0][0], bounds[0][1]),
      toDisplayLatLng(bounds[0][0], bounds[1][1]),
      toDisplayLatLng(bounds[1][0], bounds[0][1]),
      toDisplayLatLng(bounds[1][0], bounds[1][1]),
    ];
    const lats = corners.map((c) => c[0]);
    const lngs = corners.map((c) => c[1]);
    return [
      [Math.max(...lats), Math.max(...lngs)],
      [Math.min(...lats), Math.min(...lngs)],
    ];
  };

  return { toDisplayLatLng, toDisplayBounds };
}
