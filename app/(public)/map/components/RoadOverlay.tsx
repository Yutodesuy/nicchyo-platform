/**
 * Road overlay component.
 */

'use client';

import { ImageOverlay } from 'react-leaflet';
import { Polygon, Polyline } from 'react-leaflet';
import { ROAD_CONFIG, RoadConfig } from '../config/roadConfig';
import { LatLngBoundsExpression } from 'leaflet';

const PALM_IMAGE = '/images/maps/elements/decoration/yasinoki.png';

export default function RoadOverlay() {
  const config = ROAD_CONFIG;
  const latSpan = Math.abs(config.bounds[0][0] - config.bounds[1][0]);
  const lngSpan = Math.abs(config.bounds[0][1] - config.bounds[1][1]);
  const isEastWest = lngSpan > latSpan;
  const roadThickness = isEastWest ? latSpan : lngSpan;
  const separatorThickness = 0.00004;
  const roadOffset = roadThickness + separatorThickness;

  if (config.type === 'curved' && config.segments) {
    return (
      <CurvedRoad
        config={config}
        isEastWest={isEastWest}
      />
    );
  }

  if (config.type === 'placeholder') {
    return (
      <PlaceholderRoad
        config={config}
        roadThickness={roadThickness}
        roadOffset={roadOffset}
        isEastWest={isEastWest}
      />
    );
  }

  if (config.type === 'custom' && config.imagePath) {
    return (
      <>
        <ImageOverlay
          url={config.imagePath}
          bounds={config.bounds as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
        />
      </>
    );
  }

  if (config.type === 'illustration' && config.imagePath) {
    return (
      <>
        <ImageOverlay
          url={config.imagePath}
          bounds={config.bounds as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
        />
      </>
    );
  }

  return null;
}

function PlaceholderRoad({
  config,
  roadThickness,
  roadOffset,
  isEastWest,
}: {
  config: RoadConfig;
  roadThickness: number;
  roadOffset: number;
  isEastWest: boolean;
}) {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 1000" preserveAspectRatio="none">
      <rect x="0" y="0" width="100" height="1000" fill="#d4c5b0" opacity="0.85"/>
      <line x1="30" y1="0" x2="30" y2="1000" stroke="#9a8a7a" stroke-width="0.8" opacity="0.5"/>
      <line x1="70" y1="0" x2="70" y2="1000" stroke="#9a8a7a" stroke-width="0.8" opacity="0.5"/>
      <line x1="50" y1="0" x2="50" y2="1000" stroke="#a89070" stroke-width="0.4" stroke-dasharray="10,10" opacity="0.3"/>
      <rect x="0" y="0" width="100" height="1000" fill="url(#roadTexture)" opacity="0.08"/>
      <defs>
        <pattern id="roadTexture" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.5" fill="#8a7a6a"/>
          <circle cx="7" cy="6" r="0.5" fill="#8a7a6a"/>
        </pattern>
      </defs>
    </svg>
  `;

  const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;

  return (
    <>
      <ImageOverlay
        url={svgDataUrl}
        bounds={config.bounds as LatLngBoundsExpression}
        opacity={config.opacity}
        zIndex={config.zIndex}
      />
    </>
  );
}

function CurvedRoad({
  config,
  isEastWest,
}: {
  config: RoadConfig;
  isEastWest: boolean;
}) {
  if (!config.segments) {
    return null;
  }

  const anchorPoints = config.segments
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

  const centerline = densifyPath(anchorPoints, 8);
  const smoothedCenterline = smoothPath(centerline, 2);
  const roadPolygon = buildRoadPolygon(smoothedCenterline, 15.6);

  if (roadPolygon.length < 3 || smoothedCenterline.length < 2) {
    return null;
  }

  return (
    <>
      <Polygon
        positions={roadPolygon}
        pathOptions={{
          color: '#8f7d67',
          weight: 1,
          opacity: 0.8,
          fillColor: '#d4c5b0',
          fillOpacity: config.opacity ?? 0.9,
        }}
      />
      <Polyline
        positions={smoothedCenterline}
        pathOptions={{
          color: '#a89070',
          weight: 1,
          opacity: 0.5,
        }}
      />
    </>
  );
}

function densifyPath(
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

function smoothPath(path: Array<[number, number]>, radius: number): Array<[number, number]> {
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

function buildRoadPolygon(
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

function latToMeters(latDiff: number): number {
  return latDiff * 110540;
}

function lngToMeters(lngDiff: number, lat: number): number {
  return lngDiff * (111320 * Math.cos((lat * Math.PI) / 180));
}

function metersToLat(meters: number): number {
  return meters / 110540;
}

function metersToLng(meters: number, lat: number): number {
  const unit = 111320 * Math.cos((lat * Math.PI) / 180);
  if (Math.abs(unit) < 1e-6) return 0;
  return meters / unit;
}

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = latToMeters(b.lat - a.lat);
  const dLng = lngToMeters(b.lng - a.lng, (a.lat + b.lat) / 2);
  return Math.hypot(dLat, dLng);
}

function renderSeparatorBricks(
  separatorBounds: [[number, number], [number, number]]
) {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 1000" preserveAspectRatio="none">
      <rect x="0" y="0" width="100" height="1000" fill="#b45a3c"/>
    </svg>
  `;

  const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;

  return (
    <ImageOverlay
      url={svgDataUrl}
      bounds={separatorBounds as LatLngBoundsExpression}
      opacity={0.95}
      zIndex={65}
    />
  );
}

function renderSeparatorPalms(
  separatorBounds: [[number, number], [number, number]],
  isEastWest: boolean,
  keyPrefix: string = "separator-palm-"
) {
  const palmAspect = 1;
  const northLat = Math.max(separatorBounds[0][0], separatorBounds[1][0]);
  const southLat = Math.min(separatorBounds[0][0], separatorBounds[1][0]);
  const westLng = Math.min(separatorBounds[0][1], separatorBounds[1][1]);
  const eastLng = Math.max(separatorBounds[0][1], separatorBounds[1][1]);
  const totalLat = northLat - southLat;
  const totalLng = eastLng - westLng;

  const palmCount = 8;

  return Array.from({ length: palmCount }).map((_, index) => {
    let bounds: [[number, number], [number, number]];
    if (isEastWest) {
      const segmentLng = totalLng / palmCount;
      const palmWidthLng = totalLng * 0.03;
      const palmHeightLat = palmWidthLng / palmAspect;
      const palmLeft = westLng + segmentLng * index + segmentLng * 0.1;
      const palmRight = palmLeft + palmWidthLng;
      const palmTop = northLat - (totalLat - palmHeightLat) / 2;
      const palmBottom = palmTop - palmHeightLat;
      bounds = [
        [palmTop, palmLeft],
        [palmBottom, palmRight],
      ];
    } else {
      const segmentLat = totalLat / palmCount;
      const palmHeightLat = totalLat * 0.06;
      const palmWidthLng = palmHeightLat * palmAspect;
      const palmWestLng = westLng + (totalLng - palmWidthLng) / 2;
      const palmTop = northLat - segmentLat * index - segmentLat * 0.1 - palmHeightLat;
      const palmBottom = palmTop + palmHeightLat;
      bounds = [
        [palmTop, palmWestLng],
        [palmBottom, palmWestLng + palmWidthLng],
      ];
    }

    return (
      <ImageOverlay
        key={`${keyPrefix}${index}`}
        url={PALM_IMAGE}
        bounds={bounds as LatLngBoundsExpression}
        opacity={1}
        zIndex={66}
      />
    );
  });
}

function offsetBounds(
  bounds: [[number, number], [number, number]],
  offset: number,
  isEastWest: boolean
): [[number, number], [number, number]] {
  if (isEastWest) {
    return [
      [bounds[0][0] - offset, bounds[0][1]],
      [bounds[1][0] - offset, bounds[1][1]],
    ];
  }

  return [
    [bounds[0][0], bounds[0][1] + offset],
    [bounds[1][0], bounds[1][1] + offset],
  ];
}

function getRoadSeparatorBounds(
  bounds: [[number, number], [number, number]],
  roadThickness: number,
  roadOffset: number,
  isEastWest: boolean
): [[number, number], [number, number]] {
  if (isEastWest) {
    const seamLat = Math.min(bounds[0][0], bounds[1][0]);
    const separatorHeightLat = roadOffset - roadThickness;
    const westLng = Math.min(bounds[0][1], bounds[1][1]);
    const eastLng = Math.max(bounds[0][1], bounds[1][1]);
    return [
      [seamLat, eastLng],
      [seamLat - separatorHeightLat, westLng],
    ];
  }

  const seamLng = Math.max(bounds[0][1], bounds[1][1]);
  const separatorWidthLng = roadOffset - roadThickness;
  return [
    [bounds[0][0], seamLng + separatorWidthLng],
    [bounds[1][0], seamLng],
  ];
}
