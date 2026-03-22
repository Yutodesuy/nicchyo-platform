/**
 * Road overlay component.
 */

'use client';

import { Fragment } from 'react';
import { ImageOverlay, Polygon, Polyline, Rectangle } from 'react-leaflet';
import { ROAD_CONFIG, RoadConfig } from '../config/roadConfig';
import { LatLngBoundsExpression } from 'leaflet';
import type { MapRouteConfig, MapRoutePoint } from '../types/mapRoute';
import {
  buildRoadPolygon,
  densifyPath,
  getEffectiveMapRouteConfig,
  getRouteSegments,
  latToMeters,
  lngToMeters,
  metersToLat,
  metersToLng,
  normalizeMapRoutePoints,
  smoothPath,
} from '../utils/mapRouteGeometry';

const PALM_IMAGE = '/images/maps/elements/decoration/yasinoki.png';

export default function RoadOverlay({
  overviewTint = false,
  routePoints,
  routeConfig,
}: {
  overviewTint?: boolean;
  routePoints?: MapRoutePoint[];
  routeConfig?: MapRouteConfig;
}) {
  const config = ROAD_CONFIG;
  const latSpan = Math.abs(config.bounds[0][0] - config.bounds[1][0]);
  const lngSpan = Math.abs(config.bounds[0][1] - config.bounds[1][1]);
  const isEastWest = lngSpan > latSpan;
  const roadThickness = isEastWest ? latSpan : lngSpan;
  const separatorThickness = 0.00004;
  const roadOffset = roadThickness + separatorThickness;
  const normalizedRoutePoints = normalizeMapRoutePoints(routePoints ?? []);
  const effectiveRouteConfig = getEffectiveMapRouteConfig(routeConfig);

  if (normalizedRoutePoints.length >= 2) {
    return (
      <DynamicRoad
        points={normalizedRoutePoints}
        routeConfig={effectiveRouteConfig}
        overviewTint={overviewTint}
      />
    );
  }

  if (config.type === 'curved' && config.segments) {
    return (
      <CurvedRoad
        config={config}
        isEastWest={isEastWest}
        overviewTint={overviewTint}
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
        overviewTint={overviewTint}
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
        {overviewTint && (
          <Rectangle
            bounds={config.bounds as LatLngBoundsExpression}
            pathOptions={{
              stroke: false,
              fillColor: '#22c55e',
              fillOpacity: 0.34,
            }}
          />
        )}
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
        {overviewTint && (
          <Rectangle
            bounds={config.bounds as LatLngBoundsExpression}
            pathOptions={{
              stroke: false,
              fillColor: '#22c55e',
              fillOpacity: 0.34,
            }}
          />
        )}
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
  overviewTint = false,
}: {
  config: RoadConfig;
  roadThickness: number;
  roadOffset: number;
  isEastWest: boolean;
  overviewTint?: boolean;
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
      {overviewTint && (
        <Rectangle
          bounds={config.bounds as LatLngBoundsExpression}
          pathOptions={{
            stroke: false,
            fillColor: '#22c55e',
            fillOpacity: 0.34,
          }}
        />
      )}
    </>
  );
}

function CurvedRoad({
  config,
  isEastWest,
  overviewTint = false,
}: {
  config: RoadConfig;
  isEastWest: boolean;
  overviewTint?: boolean;
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
      {overviewTint && (
        <Polygon
          positions={roadPolygon}
          pathOptions={{
            stroke: false,
            fillColor: '#22c55e',
            fillOpacity: 0.36,
          }}
        />
      )}
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

function DynamicRoad({
  points,
  routeConfig,
  overviewTint = false,
}: {
  points: MapRoutePoint[];
  routeConfig: MapRouteConfig;
  overviewTint?: boolean;
}) {
  const segments = getRouteSegments(points);

  if (segments.length === 0) {
    return null;
  }

  return (
    <>
      {segments.map((segment) => {
        const centerline = densifyPath([segment.start, segment.end], 8);
        const smoothedCenterline = smoothPath(centerline, 2);
        const cappedCenterline = extendCenterlineForCaps(
          smoothedCenterline,
          routeConfig.roadHalfWidthMeters
        );
        const roadPolygon = buildRoadPolygon(cappedCenterline, routeConfig.roadHalfWidthMeters);

        if (roadPolygon.length < 3 || smoothedCenterline.length < 2) {
          return null;
        }

        return (
          <Fragment key={segment.key}>
            <Polygon
              positions={roadPolygon}
              pathOptions={{
                stroke: false,
                fillColor: '#d4c5b0',
                fillOpacity: ROAD_CONFIG.opacity ?? 0.9,
              }}
            />
            {overviewTint && (
              <Polygon
                positions={roadPolygon}
                pathOptions={{
                  stroke: false,
                  fillColor: '#22c55e',
                  fillOpacity: 0.36,
                }}
              />
            )}
            <Polyline
              positions={smoothedCenterline}
              pathOptions={{
                color: '#a89070',
                weight: 1,
                opacity: 0.5,
              }}
            />
          </Fragment>
        );
      })}
    </>
  );
}

function extendCenterlineForCaps(
  centerline: Array<[number, number]>,
  extensionMeters: number
): Array<[number, number]> {
  if (centerline.length < 2 || extensionMeters <= 0) {
    return centerline;
  }

  const first = centerline[0];
  const second = centerline[1];
  const last = centerline[centerline.length - 1];
  const beforeLast = centerline[centerline.length - 2];

  const startExtended = extendPoint(first, second, -extensionMeters);
  const endExtended = extendPoint(last, beforeLast, -extensionMeters);

  return [startExtended, ...centerline.slice(1, -1), endExtended];
}

function extendPoint(
  origin: [number, number],
  toward: [number, number],
  distanceMeters: number
): [number, number] {
  const dxMeters = lngToMeters(toward[1] - origin[1], origin[0]);
  const dyMeters = latToMeters(toward[0] - origin[0]);
  const length = Math.hypot(dxMeters, dyMeters) || 1;
  const ux = dxMeters / length;
  const uy = dyMeters / length;

  return [
    origin[0] + metersToLat(uy * distanceMeters),
    origin[1] + metersToLng(ux * distanceMeters, origin[0]),
  ];
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
