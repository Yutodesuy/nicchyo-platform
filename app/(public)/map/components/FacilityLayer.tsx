'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { facilities } from '../data/facilities';

export default function FacilityLayer() {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const layer = L.layerGroup();
    layerRef.current = layer;

    facilities.forEach(facility => {
      // Icon generation
      let iconHtml = '';
      let size: [number, number] = [32, 32];
      let anchor: [number, number] = [16, 16];

      if (facility.type === 'toilet') {
        size = [36, 36];
        anchor = [18, 18];
        // Blue circle with WC
        iconHtml = `
          <div style="
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            font-weight: bold;
            color: #3b82f6;
            font-size: 10px;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 7h8" />
              <path d="M12 17v-6" />
            </svg>
          </div>
        `;
        // Used a "Door" style icon roughly
      } else {
        size = [28, 28];
        anchor = [14, 14];
        // Green circle with Bench icon
        iconHtml = `
          <div style="
            background: white;
            border: 2px solid #22c55e;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            color: #22c55e;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="M6 19v-7" />
              <path d="M18 19v-7" />
              <path d="M4 7h16" />
            </svg>
          </div>
        `;
      }

      const icon = L.divIcon({
        html: iconHtml,
        className: 'facility-marker',
        iconSize: size,
        iconAnchor: anchor,
      });

      L.marker([facility.lat, facility.lng], { icon })
        .bindTooltip(facility.name, { direction: 'top', offset: [0, -12], opacity: 0.9 })
        .addTo(layer);
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
}
