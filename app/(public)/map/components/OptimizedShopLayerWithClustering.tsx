/**
 * Optimized shop layer with clustering.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shop } from '../data/shops';
import ShopIllustration from './ShopIllustration';
import ShopBubble from './ShopBubble';
import { ILLUSTRATION_SIZES, DEFAULT_ILLUSTRATION_SIZE } from '../config/displayConfig';

interface OptimizedShopLayerWithClusteringProps {
  shops: Shop[];
  onShopClick: (shop: Shop) => void;
  selectedShopId?: number;
  favoriteShopIds?: number[];
}

const COMPACT_ICON_SIZE: [number, number] = [24, 36];
const COMPACT_ICON_ANCHOR: [number, number] = [12, 18];
const COMPACT_ICON_MAX_ZOOM = 17.5;

export default function OptimizedShopLayerWithClustering({
  shops,
  onShopClick,
  selectedShopId,
  favoriteShopIds,
}: OptimizedShopLayerWithClusteringProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const fullIconsRef = useRef<Map<number, L.DivIcon>>(new Map());
  const compactIconsRef = useRef<Map<number, L.DivIcon>>(new Map());
  const favoriteSetRef = useRef<Set<number>>(new Set());
  const prevFavoriteSetRef = useRef<Set<number>>(new Set());
  const lastCompactStateRef = useRef<boolean | null>(null);

  const setMarkerFavorite = (marker: L.Marker, isFavorite: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isFavorite) {
      icon.classList.add('is-favorite');
    } else {
      icon.classList.remove('is-favorite');
    }
  };

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
          html: `<div class="cluster-icon ${sizeClass}">
                   <span>${count}</span>
                 </div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
        });
      },
      maxClusterRadius: 80,
    });

    clusterGroupRef.current = markers;

    shops.forEach((shop) => {
      const sizeKey = shop.illustration?.size ?? DEFAULT_ILLUSTRATION_SIZE;
      const sizeConfig = ILLUSTRATION_SIZES[sizeKey];

      const iconMarkup = renderToStaticMarkup(
        <div
          className={`shop-marker-container shop-side-${shop.side}`}
          style={{
            position: 'relative',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
        >
          <div className="shop-favorite-badge" aria-hidden="true">
            &#10084;
          </div>
          <ShopBubble
            icon={shop.icon}
            products={shop.products}
            side={shop.side}
            offset={sizeConfig.bubbleOffset}
          />
          <ShopIllustration
            type={shop.illustration?.type}
            size={sizeKey}
            color={shop.illustration?.color}
            customSvg={shop.illustration?.customSvg}
          />
        </div>
      );

      const fullIcon = L.divIcon({
        html: iconMarkup,
        className: 'custom-shop-marker',
        iconSize: [sizeConfig.width, sizeConfig.height],
        iconAnchor: [sizeConfig.anchor[0], sizeConfig.anchor[1]],
      });

      const compactIcon = L.divIcon({
        html: '<div class="shop-marker-compact"></div>',
        className: 'custom-shop-marker compact-shop-marker',
        iconSize: COMPACT_ICON_SIZE,
        iconAnchor: COMPACT_ICON_ANCHOR,
      });

      const marker = L.marker([shop.lat, shop.lng], {
        icon: fullIcon,
      });

      marker.on('click', () => {
        onShopClick(shop);
      });
      marker.on('add', () => {
        setMarkerFavorite(marker, favoriteSetRef.current.has(shop.id));
      });

      markers.addLayer(marker);
      markersRef.current.set(shop.id, marker);
      fullIconsRef.current.set(shop.id, fullIcon);
      compactIconsRef.current.set(shop.id, compactIcon);
    });

    const updateMarkerDensity = () => {
      const zoom = map.getZoom();
      const useCompact = zoom <= COMPACT_ICON_MAX_ZOOM;
      if (lastCompactStateRef.current === useCompact) return;
      lastCompactStateRef.current = useCompact;

      markersRef.current.forEach((marker, shopId) => {
        const icon = useCompact
          ? compactIconsRef.current.get(shopId)
          : fullIconsRef.current.get(shopId);
        if (icon) {
          marker.setIcon(icon);
        }
      });
    };

    map.on('zoomend', updateMarkerDensity);
    updateMarkerDensity();

    map.addLayer(markers);

    return () => {
      map.off('zoomend', updateMarkerDensity);
      map.removeLayer(markers);
      clusterGroupRef.current = null;
      markersRef.current.clear();
      fullIconsRef.current.clear();
      compactIconsRef.current.clear();
    };
  }, [shops, map, onShopClick]);

  useEffect(() => {
    favoriteSetRef.current = new Set(favoriteShopIds ?? []);
    const nextFavorites = favoriteSetRef.current;
    const prevFavorites = prevFavoriteSetRef.current;
    const changed = new Set<number>();

    prevFavorites.forEach((id) => {
      if (!nextFavorites.has(id)) changed.add(id);
    });
    nextFavorites.forEach((id) => {
      if (!prevFavorites.has(id)) changed.add(id);
    });

    changed.forEach((id) => {
      const marker = markersRef.current.get(id);
      if (marker) {
        setMarkerFavorite(marker, nextFavorites.has(id));
      }
    });

    prevFavoriteSetRef.current = nextFavorites;
  }, [favoriteShopIds]);

  useEffect(() => {
    markersRef.current.forEach((marker, shopId) => {
      const icon = marker.getElement();
      if (icon) {
        if (shopId === selectedShopId) {
          icon.classList.add('shop-marker-selected');
          marker.setZIndexOffset(1000);
        } else {
          icon.classList.remove('shop-marker-selected');
          marker.setZIndexOffset(0);
        }
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
