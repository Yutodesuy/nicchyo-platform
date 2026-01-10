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
  searchShopIds?: number[];
  aiHighlightShopIds?: number[];
}

const COMPACT_ICON_SIZE: [number, number] = [24, 36];
const COMPACT_ICON_ANCHOR: [number, number] = [12, 18];
const COMPACT_ICON_MAX_ZOOM = 17.5;
const MID_ICON_MAX_ZOOM = 18.0;

export default function OptimizedShopLayerWithClustering({
  shops,
  onShopClick,
  selectedShopId,
  favoriteShopIds,
  searchShopIds,
  aiHighlightShopIds,
}: OptimizedShopLayerWithClusteringProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const fullIconsRef = useRef<Map<number, L.DivIcon>>(new Map());
  const midIconsRef = useRef<Map<number, L.DivIcon>>(new Map());
  const compactIconsRef = useRef<Map<number, L.DivIcon>>(new Map());
  const favoriteSetRef = useRef<Set<number>>(new Set());
  const prevFavoriteSetRef = useRef<Set<number>>(new Set());
  const searchHighlightSetRef = useRef<Set<number>>(new Set());
  const prevSearchHighlightSetRef = useRef<Set<number>>(new Set());
  const aiHighlightSetRef = useRef<Set<number>>(new Set());
  const prevAiHighlightSetRef = useRef<Set<number>>(new Set());
  const lastIconModeRef = useRef<'compact' | 'mid' | 'full' | null>(null);
  const selectedShopIdRef = useRef<number | undefined>(undefined);

  const setMarkerFavorite = (marker: L.Marker, isFavorite: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isFavorite) {
      icon.classList.add('is-favorite');
    } else {
      icon.classList.remove('is-favorite');
    }
  };

  const setMarkerHighlight = (marker: L.Marker, shopId: number, isHighlighted: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isHighlighted) {
      icon.classList.add('shop-marker-ai');
      if (selectedShopIdRef.current !== shopId) {
        marker.setZIndexOffset(900);
      }
    } else {
      icon.classList.remove('shop-marker-ai');
      if (selectedShopIdRef.current !== shopId) {
        marker.setZIndexOffset(0);
      }
    }
  };

  const setMarkerSearchHighlight = (
    marker: L.Marker,
    isHighlighted: boolean
  ) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isHighlighted) {
      icon.classList.add('shop-marker-search');
    } else {
      icon.classList.remove('shop-marker-search');
    }
  };

  useEffect(() => {
    selectedShopIdRef.current = selectedShopId;
  }, [selectedShopId]);

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

      const midIconMarkup = renderToStaticMarkup(
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
          <ShopIllustration
            type={shop.illustration?.type}
            size={sizeKey}
            color={shop.illustration?.color}
            customSvg={shop.illustration?.customSvg}
          />
        </div>
      );

      const midIcon = L.divIcon({
        html: midIconMarkup,
        className: 'custom-shop-marker',
        iconSize: [sizeConfig.width, sizeConfig.height],
        iconAnchor: [sizeConfig.anchor[0], sizeConfig.anchor[1]],
      });

      const compactIcon = L.divIcon({
        html: `
          <div class="shop-marker-compact-wrapper shop-side-${shop.side}">
            <div class="shop-favorite-badge" aria-hidden="true">&#10084;</div>
            <div class="shop-marker-compact"></div>
          </div>
        `,
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
        setMarkerHighlight(marker, shop.id, aiHighlightSetRef.current.has(shop.id));
        setMarkerSearchHighlight(marker, searchHighlightSetRef.current.has(shop.id));
      });

      markers.addLayer(marker);
      markersRef.current.set(shop.id, marker);
      fullIconsRef.current.set(shop.id, fullIcon);
      midIconsRef.current.set(shop.id, midIcon);
      compactIconsRef.current.set(shop.id, compactIcon);
    });

    const updateMarkerDensity = () => {
      const zoom = map.getZoom();
      const useCompact = zoom <= COMPACT_ICON_MAX_ZOOM;
      const useMid = zoom > COMPACT_ICON_MAX_ZOOM && zoom <= MID_ICON_MAX_ZOOM;
      const nextMode: 'compact' | 'mid' | 'full' = useCompact
        ? 'compact'
        : useMid
          ? 'mid'
          : 'full';
      if (lastIconModeRef.current === nextMode) return;
      lastIconModeRef.current = nextMode;

      markersRef.current.forEach((marker, shopId) => {
        const icon = useCompact
          ? compactIconsRef.current.get(shopId)
          : useMid
            ? midIconsRef.current.get(shopId)
            : fullIconsRef.current.get(shopId);
        if (icon) {
          marker.setIcon(icon);
          setMarkerFavorite(marker, favoriteSetRef.current.has(shopId));
          const markerElement = marker.getElement();
          if (markerElement) {
            if (shopId === selectedShopIdRef.current) {
              markerElement.classList.add('shop-marker-selected');
              marker.setZIndexOffset(1000);
            } else {
              markerElement.classList.remove('shop-marker-selected');
              marker.setZIndexOffset(0);
            }
            if (aiHighlightSetRef.current.has(shopId)) {
              markerElement.classList.add('shop-marker-ai');
              if (shopId !== selectedShopIdRef.current) {
                marker.setZIndexOffset(900);
              }
            } else {
              markerElement.classList.remove('shop-marker-ai');
            }
            if (searchHighlightSetRef.current.has(shopId)) {
              markerElement.classList.add('shop-marker-search');
            } else {
              markerElement.classList.remove('shop-marker-search');
            }
          }
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
      midIconsRef.current.clear();
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
    searchHighlightSetRef.current = new Set(searchShopIds ?? []);
    const nextHighlights = searchHighlightSetRef.current;
    const prevHighlights = prevSearchHighlightSetRef.current;
    const changed = new Set<number>();

    prevHighlights.forEach((id) => {
      if (!nextHighlights.has(id)) changed.add(id);
    });
    nextHighlights.forEach((id) => {
      if (!prevHighlights.has(id)) changed.add(id);
    });

    changed.forEach((id) => {
      const marker = markersRef.current.get(id);
      if (marker) {
        setMarkerSearchHighlight(marker, nextHighlights.has(id));
      }
    });

    prevSearchHighlightSetRef.current = nextHighlights;
  }, [searchShopIds]);

  useEffect(() => {
    aiHighlightSetRef.current = new Set(aiHighlightShopIds ?? []);
    const nextHighlights = aiHighlightSetRef.current;
    const prevHighlights = prevAiHighlightSetRef.current;
    const changed = new Set<number>();

    prevHighlights.forEach((id) => {
      if (!nextHighlights.has(id)) changed.add(id);
    });
    nextHighlights.forEach((id) => {
      if (!prevHighlights.has(id)) changed.add(id);
    });

    changed.forEach((id) => {
      const marker = markersRef.current.get(id);
      if (marker) {
        setMarkerHighlight(marker, id, nextHighlights.has(id));
      }
    });

    prevAiHighlightSetRef.current = nextHighlights;
  }, [aiHighlightShopIds]);

  useEffect(() => {
    markersRef.current.forEach((marker, shopId) => {
      const icon = marker.getElement();
      if (icon) {
        if (shopId === selectedShopId) {
          icon.classList.add('shop-marker-selected');
          marker.setZIndexOffset(1000);
        } else {
          icon.classList.remove('shop-marker-selected');
          if (aiHighlightSetRef.current.has(shopId)) {
            marker.setZIndexOffset(900);
          } else {
            marker.setZIndexOffset(0);
          }
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
