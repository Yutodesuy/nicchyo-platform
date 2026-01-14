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
import { ILLUSTRATION_SIZES, DEFAULT_ILLUSTRATION_SIZE } from '../config/displayConfig';
import { getShopBannerImage } from '../../../../lib/shopImages';

interface OptimizedShopLayerWithClusteringProps {
  shops: Shop[];
  onShopClick: (shop: Shop) => void;
  selectedShopId?: number;
  favoriteShopIds?: number[];
  searchShopIds?: number[];
  aiHighlightShopIds?: number[];
  commentHighlightShopIds?: number[];
  kotoduteShopIds?: number[];
  recipeIngredientIconsByShop?: Record<number, string[]>;
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
  commentHighlightShopIds,
  kotoduteShopIds,
  recipeIngredientIconsByShop,
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
  const commentHighlightSetRef = useRef<Set<number>>(new Set());
  const prevCommentHighlightSetRef = useRef<Set<number>>(new Set());
  const kotoduteSetRef = useRef<Set<number>>(new Set());
  const prevKotoduteSetRef = useRef<Set<number>>(new Set());
  const recipeIconsRef = useRef<Record<number, string[]>>({});
  const lastIconModeRef = useRef<'compact' | 'mid' | 'full' | null>(null);
  const lastProductIconVisibleRef = useRef<boolean | null>(null);
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

  const setMarkerCommentHighlight = (marker: L.Marker, isHighlighted: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isHighlighted) {
      icon.classList.add('shop-marker-comment');
    } else {
      icon.classList.remove('shop-marker-comment');
    }
  };

  const setMarkerKotodute = (marker: L.Marker, isHighlighted: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isHighlighted) {
      icon.classList.add('shop-marker-kotodute');
    } else {
      icon.classList.remove('shop-marker-kotodute');
    }
  };

  const setMarkerRecipeIcons = (marker: L.Marker, icons?: string[]) => {
    const icon = marker.getElement();
    if (!icon) return;
    const container = icon.querySelector('.shop-recipe-icons');
    if (!container) return;
    const hasIcons = !!icons && icons.length > 0;
    if (hasIcons) {
      container.innerHTML = icons
        ?.map((recipeIcon) => `<span class="shop-recipe-icon">${recipeIcon}</span>`)
        .join('') ?? '';
      icon.classList.add('shop-marker-recipe');
    } else {
      container.innerHTML = '';
      icon.classList.remove('shop-marker-recipe');
    }
  };

  const setMarkerProductIconVisibility = (marker: L.Marker, isVisible: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isVisible) {
      icon.classList.add('shop-product-icon-visible');
    } else {
      icon.classList.remove('shop-product-icon-visible');
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
          html: `<div class="cluster-icon ${sizeClass}"><span>${count}</span></div>`,
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
          {(shop.images?.main || getShopBannerImage(shop.category)) && (
            <img
              src={shop.images?.main ?? getShopBannerImage(shop.category)}
              alt=""
              className="shop-product-icon"
              aria-hidden="true"
            />
          )}
          <div className="shop-recipe-icons" aria-hidden="true" />
          <div className="shop-kotodute-badge" aria-hidden="true">
            i
          </div>
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
          <div className="shop-recipe-icons" aria-hidden="true" />
          <div className="shop-kotodute-badge" aria-hidden="true">
            i
          </div>
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
            <div class="shop-recipe-icons" aria-hidden="true"></div>
            <div class="shop-kotodute-badge" aria-hidden="true">i</div>
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
        setMarkerCommentHighlight(marker, commentHighlightSetRef.current.has(shop.id));
        setMarkerKotodute(marker, kotoduteSetRef.current.has(shop.id));
        setMarkerRecipeIcons(marker, recipeIconsRef.current[shop.id]);
        setMarkerProductIconVisibility(marker, map.getZoom() === map.getMaxZoom());
      });

      markers.addLayer(marker);
      markersRef.current.set(shop.id, marker);
      fullIconsRef.current.set(shop.id, fullIcon);
      midIconsRef.current.set(shop.id, midIcon);
      compactIconsRef.current.set(shop.id, compactIcon);
    });

    const updateMarkerDensity = () => {
      const zoom = map.getZoom();
      const showProductIcon = zoom === map.getMaxZoom();
      const useCompact = zoom <= COMPACT_ICON_MAX_ZOOM;
      const useMid = zoom > COMPACT_ICON_MAX_ZOOM && zoom <= MID_ICON_MAX_ZOOM;
      const nextMode: 'compact' | 'mid' | 'full' = useCompact
        ? 'compact'
        : useMid
          ? 'mid'
          : 'full';
      if (
        lastIconModeRef.current === nextMode &&
        lastProductIconVisibleRef.current === showProductIcon
      ) {
        return;
      }
      lastIconModeRef.current = nextMode;
      lastProductIconVisibleRef.current = showProductIcon;

      markersRef.current.forEach((marker, shopId) => {
        const icon = useCompact
          ? compactIconsRef.current.get(shopId)
          : useMid
            ? midIconsRef.current.get(shopId)
            : fullIconsRef.current.get(shopId);
        if (icon) {
          marker.setIcon(icon);
          setMarkerFavorite(marker, favoriteSetRef.current.has(shopId));
          setMarkerRecipeIcons(marker, recipeIconsRef.current[shopId]);
          setMarkerProductIconVisibility(marker, showProductIcon);
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
            if (commentHighlightSetRef.current.has(shopId)) {
              markerElement.classList.add('shop-marker-comment');
            } else {
              markerElement.classList.remove('shop-marker-comment');
            }
            if (kotoduteSetRef.current.has(shopId)) {
              markerElement.classList.add('shop-marker-kotodute');
            } else {
              markerElement.classList.remove('shop-marker-kotodute');
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
    commentHighlightSetRef.current = new Set(commentHighlightShopIds ?? []);
    const nextHighlights = commentHighlightSetRef.current;
    const prevHighlights = prevCommentHighlightSetRef.current;
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
        setMarkerCommentHighlight(marker, nextHighlights.has(id));
      }
    });

    prevCommentHighlightSetRef.current = nextHighlights;
  }, [commentHighlightShopIds]);

  useEffect(() => {
    kotoduteSetRef.current = new Set(kotoduteShopIds ?? []);
    const nextHighlights = kotoduteSetRef.current;
    const prevHighlights = prevKotoduteSetRef.current;
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
        setMarkerKotodute(marker, nextHighlights.has(id));
      }
    });

    prevKotoduteSetRef.current = nextHighlights;
  }, [kotoduteShopIds]);

  useEffect(() => {
    recipeIconsRef.current = recipeIngredientIconsByShop ?? {};
    markersRef.current.forEach((marker, shopId) => {
      setMarkerRecipeIcons(marker, recipeIconsRef.current[shopId]);
    });
  }, [recipeIngredientIconsByShop]);

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
