/**
 * Optimized shop layer with clustering.
 *
 * - Uses leaflet.markercluster directly for performance.
 * - Renders markers on canvas to minimize DOM work.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Shop } from '../data/shops';

interface OptimizedShopLayerWithClusteringProps {
  shops: Shop[];
  onShopClick: (shop: Shop) => void;
  selectedShopId?: number;
}

export default function OptimizedShopLayerWithClustering({
  shops,
  onShopClick,
  selectedShopId,
}: OptimizedShopLayerWithClusteringProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<number, L.CircleMarker>>(new Map());

  useEffect(() => {
    const markers = L.markerClusterGroup({
      disableClusteringAtZoom: 17,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let sizeClass = 'cluster-small';

        if (count > 50) {
          sizeClass = 'cluster-large';
        } else if (count > 10) {
          sizeClass = 'cluster-medium';
        }

        return L.divIcon({
          html: `<div class="cluster-icon ${sizeClass}"><span>${count}</span></div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
        });
      },
      maxClusterRadius: 80,
    });

    clusterGroupRef.current = markers;

    const canvasRenderer = L.canvas({ padding: 0.5 });

    shops.forEach((shop) => {
      const marker = L.circleMarker([shop.lat, shop.lng], {
        renderer: canvasRenderer,
        radius: 8,
        fillColor: getCategoryColor(shop.category),
        fillOpacity: 0.8,
        color: '#fff',
        weight: 2,
      });

      marker.on('click', () => {
        onShopClick(shop);
      });

      marker.bindTooltip(shop.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
      });

      markers.addLayer(marker);
      markersRef.current.set(shop.id, marker);
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
      clusterGroupRef.current = null;
      markersRef.current.clear();
    };
  }, [shops, map, onShopClick]);

  useEffect(() => {
    markersRef.current.forEach((marker, shopId) => {
      if (shopId === selectedShopId) {
        marker.setStyle({
          radius: 12,
          weight: 3,
          fillOpacity: 1.0,
        });
        marker.bringToFront();
      } else {
        marker.setStyle({
          radius: 8,
          weight: 2,
          fillOpacity: 0.8,
        });
      }
    });

    if (selectedShopId && clusterGroupRef.current) {
      const selectedMarker = markersRef.current.get(selectedShopId);
      if (selectedMarker) {
        clusterGroupRef.current.zoomToShowLayer(selectedMarker, () => {});
      }
    }
  }, [selectedShopId]);

  return null;
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    '食材': '#22c55e',
    '食べ物': '#f59e0b',
    '道具・工具': '#3b82f6',
    '生活雑貨': '#8b5cf6',
    '植物・苗': '#10b981',
    'アクセサリー': '#ec4899',
    '手作り・工芸': '#f97316',
  };

  return colorMap[category] || '#6b7280';
}
