/**
 * Road overlay component.
 */

'use client';

import { ImageOverlay } from 'react-leaflet';
import { ROAD_CONFIG, RoadConfig } from '../config/roadConfig';
import { LatLngBoundsExpression } from 'leaflet';

const PALM_IMAGE = '/images/maps/elements/decoration/yasinoki.png';

type RoadOverlayProps = {
  transformBounds?: (bounds: [[number, number], [number, number]]) => [[number, number], [number, number]];
  overlayClassName?: string;
};

export default function RoadOverlay({ transformBounds, overlayClassName }: RoadOverlayProps = {}) {
  const config = ROAD_CONFIG;
  const roadWidthLng = Math.abs(config.bounds[0][1] - config.bounds[1][1]);
  const separatorWidthLng = 0.00004;
  const roadOffsetLng = roadWidthLng + separatorWidthLng;
  const toDisplayBounds = transformBounds ?? ((bounds) => bounds);

  if (config.type === 'curved' && config.segments) {
    return (
      <CurvedRoad
        config={config}
        roadWidthLng={roadWidthLng}
        roadOffsetLng={roadOffsetLng}
        transformBounds={toDisplayBounds}
        overlayClassName={overlayClassName}
      />
    );
  }

  if (config.type === 'placeholder') {
    return (
      <PlaceholderRoad
        config={config}
        roadWidthLng={roadWidthLng}
        roadOffsetLng={roadOffsetLng}
        transformBounds={toDisplayBounds}
        overlayClassName={overlayClassName}
      />
    );
  }

  if (config.type === 'custom' && config.imagePath) {
    return (
      <>
        <ImageOverlay
          url={config.imagePath}
          bounds={toDisplayBounds(config.bounds) as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
          className={overlayClassName}
        />
        <ImageOverlay
          url={config.imagePath}
          bounds={toDisplayBounds(offsetBounds(config.bounds, roadOffsetLng)) as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
          className={overlayClassName}
        />
        {renderSeparatorBricks(
          getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
          toDisplayBounds,
          overlayClassName
        )}
        {renderSeparatorPalms(
          getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
          toDisplayBounds,
          overlayClassName
        )}
      </>
    );
  }

  if (config.type === 'illustration' && config.imagePath) {
    return (
      <>
        <ImageOverlay
          url={config.imagePath}
          bounds={toDisplayBounds(config.bounds) as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
          className={overlayClassName}
        />
        <ImageOverlay
          url={config.imagePath}
          bounds={toDisplayBounds(offsetBounds(config.bounds, roadOffsetLng)) as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
          className={overlayClassName}
        />
        {renderSeparatorBricks(
          getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
          toDisplayBounds,
          overlayClassName
        )}
        {renderSeparatorPalms(
          getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
          toDisplayBounds,
          overlayClassName
        )}
      </>
    );
  }

  return (
    <>
      {renderSeparatorBricks(
        getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
        toDisplayBounds,
        overlayClassName
      )}
      {renderSeparatorPalms(
        getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
        toDisplayBounds,
        overlayClassName
      )}
    </>
  );
}

function PlaceholderRoad({
  config,
  roadWidthLng,
  roadOffsetLng,
  transformBounds,
  overlayClassName,
}: {
  config: RoadConfig;
  roadWidthLng: number;
  roadOffsetLng: number;
  transformBounds: (bounds: [[number, number], [number, number]]) => [[number, number], [number, number]];
  overlayClassName?: string;
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
        bounds={transformBounds(config.bounds) as LatLngBoundsExpression}
        opacity={config.opacity}
        zIndex={config.zIndex}
        className={overlayClassName}
      />
      <ImageOverlay
        url={svgDataUrl}
        bounds={transformBounds(offsetBounds(config.bounds, roadOffsetLng)) as LatLngBoundsExpression}
        opacity={config.opacity}
        zIndex={config.zIndex}
        className={overlayClassName}
      />
      {renderSeparatorBricks(
        getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
        transformBounds,
        overlayClassName
      )}
      {renderSeparatorPalms(
        getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
        transformBounds,
        overlayClassName
      )}
    </>
  );
}

function CurvedRoad({
  config,
  roadWidthLng,
  roadOffsetLng,
  transformBounds,
  overlayClassName,
}: {
  config: RoadConfig;
  roadWidthLng: number;
  roadOffsetLng: number;
  transformBounds: (bounds: [[number, number], [number, number]]) => [[number, number], [number, number]];
  overlayClassName?: string;
}) {
  if (!config.segments) {
    return null;
  }

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
      {config.segments.map((segment, index) => (
        <ImageOverlay
          key={`road-segment-${segment.name}-${index}`}
          url={svgDataUrl}
          bounds={transformBounds(segment.bounds) as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
          className={overlayClassName}
        />
      ))}
      {config.segments.map((segment, index) => (
        <ImageOverlay
          key={`road-segment-offset-${segment.name}-${index}`}
          url={svgDataUrl}
          bounds={transformBounds(offsetBounds(segment.bounds, roadOffsetLng)) as LatLngBoundsExpression}
          opacity={config.opacity}
          zIndex={config.zIndex}
          className={overlayClassName}
        />
      ))}
      {renderSeparatorBricks(
        getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
        transformBounds,
        overlayClassName
      )}
      {renderSeparatorPalms(
        getRoadSeparatorBounds(config.bounds, roadWidthLng, roadOffsetLng),
        transformBounds,
        overlayClassName
      )}
    </>
  );
}

function renderSeparatorBricks(
  separatorBounds: [[number, number], [number, number]],
  transformBounds: (bounds: [[number, number], [number, number]]) => [[number, number], [number, number]],
  overlayClassName?: string
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
      bounds={transformBounds(separatorBounds) as LatLngBoundsExpression}
      opacity={0.95}
      zIndex={65}
      className={overlayClassName}
    />
  );
}

function renderSeparatorPalms(
  separatorBounds: [[number, number], [number, number]],
  transformBounds: (bounds: [[number, number], [number, number]]) => [[number, number], [number, number]],
  overlayClassName?: string
) {
  const palmAspect = 1;
  const northLat = Math.max(separatorBounds[0][0], separatorBounds[1][0]);
  const southLat = Math.min(separatorBounds[0][0], separatorBounds[1][0]);
  const westLng = Math.min(separatorBounds[0][1], separatorBounds[1][1]);
  const eastLng = Math.max(separatorBounds[0][1], separatorBounds[1][1]);
  const totalLat = northLat - southLat;
  const totalLng = eastLng - westLng;

  const palmCount = 8;
  const segmentLat = totalLat / palmCount;
  let palmHeightLat = totalLat * 0.06;
  let palmWidthLng = palmHeightLat * palmAspect;
  const palmWestLng = westLng + (totalLng - palmWidthLng) / 2;
  const palmOffsetLat = segmentLat * 0.1;

  return Array.from({ length: palmCount }).map((_, index) => {
    const palmTop = northLat - segmentLat * index - palmOffsetLat - palmHeightLat;
    const palmBottom = palmTop + palmHeightLat;
    const bounds: [[number, number], [number, number]] = [
      [palmTop, palmWestLng],
      [palmBottom, palmWestLng + palmWidthLng],
    ];

    return (
      <ImageOverlay
        key={`separator-palm-${index}`}
        url={PALM_IMAGE}
        bounds={transformBounds(bounds) as LatLngBoundsExpression}
        opacity={1}
        zIndex={66}
        className={overlayClassName}
      />
    );
  });
}

function offsetBounds(
  bounds: [[number, number], [number, number]],
  lngOffset: number
): [[number, number], [number, number]] {
  return [
    [bounds[0][0], bounds[0][1] + lngOffset],
    [bounds[1][0], bounds[1][1] + lngOffset],
  ];
}

function getRoadSeparatorBounds(
  bounds: [[number, number], [number, number]],
  roadWidthLng: number,
  roadOffsetLng: number
): [[number, number], [number, number]] {
  const seamLng = Math.max(bounds[0][1], bounds[1][1]);
  const separatorWidthLng = roadOffsetLng - roadWidthLng;
  return [
    [bounds[0][0], seamLng + separatorWidthLng],
    [bounds[1][0], seamLng],
  ];
}
