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
import { Shop } from '../data/shops';
import { ILLUSTRATION_SIZES, DEFAULT_ILLUSTRATION_SIZE } from '../config/displayConfig';
import { getShopBannerImage } from '../../../../lib/shopImages';
import { generateShopMarkerHtml } from '../utils/markerHtmlGenerator';

type ShopBannerOrigin = { x: number; y: number; width: number; height: number };

interface OptimizedShopLayerWithClusteringProps {
  shops: Shop[];
  onShopClick: (shop: Shop, origin?: ShopBannerOrigin) => void;
  selectedShopId?: number;
  favoriteShopIds?: number[];
  searchShopIds?: number[];
  consultShopIds?: number[];
  aiHighlightShopIds?: number[];
  commentHighlightShopIds?: number[];
  kotoduteShopIds?: number[];
  recipeIngredientIconsByShop?: Record<number, string[]>;
  attendanceLabelsByShop?: Record<number, string>;
  bagShopIds?: number[];
}

const COMPACT_ICON_SIZE: [number, number] = [24, 36];
const COMPACT_ICON_ANCHOR: [number, number] = [12, 18];
const COMPACT_ICON_MAX_ZOOM = 17.5;
const MID_ICON_MAX_ZOOM = 18.0;

// Helper to get origin rect for animation
const getOriginRect = (marker: L.Marker): ShopBannerOrigin | undefined => {
  const element = marker.getElement();
  if (!element) return undefined;
  const banner = element.querySelector<HTMLElement>(".shop-simple-banner");
  const target = banner && banner.offsetParent ? banner : element;
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return undefined;
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
};

export default function OptimizedShopLayerWithClustering({
  shops,
  onShopClick,
  selectedShopId,
  favoriteShopIds,
  searchShopIds,
  consultShopIds,
  aiHighlightShopIds,
  commentHighlightShopIds,
  kotoduteShopIds,
  recipeIngredientIconsByShop,
  attendanceLabelsByShop,
  bagShopIds,
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
  const consultHighlightSetRef = useRef<Set<number>>(new Set());
  const prevConsultHighlightSetRef = useRef<Set<number>>(new Set());
  const aiHighlightSetRef = useRef<Set<number>>(new Set());
  const prevAiHighlightSetRef = useRef<Set<number>>(new Set());
  const commentHighlightSetRef = useRef<Set<number>>(new Set());
  const prevCommentHighlightSetRef = useRef<Set<number>>(new Set());
  const kotoduteSetRef = useRef<Set<number>>(new Set());
  const prevKotoduteSetRef = useRef<Set<number>>(new Set());
  const bagShopSetRef = useRef<Set<number>>(new Set());
  const prevBagShopSetRef = useRef<Set<number>>(new Set());
  const recipeIconsRef = useRef<Record<number, string[]>>({});
  const attendanceLabelsRef = useRef<Record<number, string>>(attendanceLabelsByShop ?? {});
  const lastIconModeRef = useRef<'compact' | 'mid' | 'full' | null>(null);
  const lastProductIconVisibleRef = useRef<boolean | null>(null);
  const lastSimpleBannerVisibleRef = useRef<boolean | null>(null);
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

  const setMarkerConsultHighlight = (marker: L.Marker, isHighlighted: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isHighlighted) {
      icon.classList.add('shop-marker-consult');
    } else {
      icon.classList.remove('shop-marker-consult');
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

  const setMarkerBag = (marker: L.Marker, isHighlighted: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isHighlighted) {
      icon.classList.add('shop-marker-bag');
    } else {
      icon.classList.remove('shop-marker-bag');
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

  const setMarkerSimpleBannerVisibility = (marker: L.Marker, isVisible: boolean) => {
    const icon = marker.getElement();
    if (!icon) return;
    if (isVisible) {
      icon.classList.add('shop-simple-banner-visible');
    } else {
      icon.classList.remove('shop-simple-banner-visible');
    }
  };

  const setMarkerAttendanceLabel = (marker: L.Marker, label: string) => {
    const icon = marker.getElement();
    if (!icon) return;
    const labelElement = icon.querySelector('.shop-simple-banner-status');
    if (labelElement) {
      labelElement.textContent = label;
    }
  };

  useEffect(() => {
    selectedShopIdRef.current = selectedShopId;
  }, [selectedShopId]);

  useEffect(() => {
    attendanceLabelsRef.current = attendanceLabelsByShop ?? {};
    markersRef.current.forEach((marker, shopId) => {
      const label = attendanceLabelsRef.current[shopId] ?? 'わからない';
      setMarkerAttendanceLabel(marker, label);
    });
  }, [attendanceLabelsByShop]);

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

    const createCompactIcon = (shop: Shop) => {
      return L.divIcon({
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
    };

    const createMidIcon = (shop: Shop) => {
      const sizeKey = shop.illustration?.size ?? DEFAULT_ILLUSTRATION_SIZE;
      const sizeConfig = ILLUSTRATION_SIZES[sizeKey];
      const mainProduct = shop.products?.[0] ?? shop.category ?? '-';
      const attendanceLabel = attendanceLabelsRef.current[shop.id] ?? 'わからない';
      const bannerSeed = (shop.position ?? shop.id) * 2 + (shop.side === "south" ? 1 : 0);
      const bannerImage = shop.images?.main ?? getShopBannerImage(shop.category, bannerSeed);

      const midIconMarkup = generateShopMarkerHtml(
        shop,
        'mid',
        bannerImage,
        attendanceLabel,
        sizeKey,
        mainProduct
      );

      return L.divIcon({
        html: midIconMarkup,
        className: 'custom-shop-marker',
        iconSize: [sizeConfig.width, sizeConfig.height],
        iconAnchor: [sizeConfig.anchor[0], sizeConfig.anchor[1]],
      });
    };

    const createFullIcon = (shop: Shop) => {
      const sizeKey = shop.illustration?.size ?? DEFAULT_ILLUSTRATION_SIZE;
      const sizeConfig = ILLUSTRATION_SIZES[sizeKey];
      const mainProduct = shop.products?.[0] ?? shop.category ?? '-';
      const attendanceLabel = attendanceLabelsRef.current[shop.id] ?? 'わからない';
      const bannerSeed = (shop.position ?? shop.id) * 2 + (shop.side === "south" ? 1 : 0);
      const bannerImage = shop.images?.main ?? getShopBannerImage(shop.category, bannerSeed);

      const iconMarkup = generateShopMarkerHtml(
        shop,
        'full',
        bannerImage,
        attendanceLabel,
        sizeKey,
        mainProduct
      );

      return L.divIcon({
        html: iconMarkup,
        className: 'custom-shop-marker',
        iconSize: [sizeConfig.width, sizeConfig.height],
        iconAnchor: [sizeConfig.anchor[0], sizeConfig.anchor[1]],
      });
    };

    // Lazy initialization: determine initial icon mode based on current zoom
    const zoom = map.getZoom();
    const useCompact = zoom <= COMPACT_ICON_MAX_ZOOM;
    const useMid = zoom > COMPACT_ICON_MAX_ZOOM && zoom <= MID_ICON_MAX_ZOOM;
    const initialMode = useCompact ? 'compact' : (useMid ? 'mid' : 'full');

    // Create a map for fast shop lookup during density updates
    const shopsMap = new Map<number, Shop>(shops.map(s => [s.id, s]));

    shops.forEach((shop) => {
      let initialIcon: L.DivIcon;

      // Only generate the icon needed for the current view
      if (initialMode === 'compact') {
        initialIcon = createCompactIcon(shop);
        compactIconsRef.current.set(shop.id, initialIcon);
      } else if (initialMode === 'mid') {
        initialIcon = createMidIcon(shop);
        midIconsRef.current.set(shop.id, initialIcon);
      } else {
        initialIcon = createFullIcon(shop);
        fullIconsRef.current.set(shop.id, initialIcon);
      }

      const marker = L.marker([shop.lat, shop.lng], {
        icon: initialIcon,
      });

      marker.on('click', () => {
        const origin = getOriginRect(marker);
        onShopClick(shop, origin);
      });
      marker.on('add', () => {
        setMarkerFavorite(marker, favoriteSetRef.current.has(shop.id));
        setMarkerHighlight(marker, shop.id, aiHighlightSetRef.current.has(shop.id));
        setMarkerSearchHighlight(marker, searchHighlightSetRef.current.has(shop.id));
        setMarkerConsultHighlight(marker, consultHighlightSetRef.current.has(shop.id));
        setMarkerCommentHighlight(marker, commentHighlightSetRef.current.has(shop.id));
        setMarkerKotodute(marker, kotoduteSetRef.current.has(shop.id));
        setMarkerBag(marker, bagShopSetRef.current.has(shop.id));
        setMarkerRecipeIcons(marker, recipeIconsRef.current[shop.id]);
        const maxZoom = map.getMaxZoom() ?? map.getZoom();
        const isMaxZoom = map.getZoom() >= maxZoom - 0.001;
        setMarkerProductIconVisibility(marker, map.getZoom() >= maxZoom - 1 && !isMaxZoom);
        setMarkerSimpleBannerVisibility(marker, isMaxZoom);
        setMarkerAttendanceLabel(
          marker,
          attendanceLabelsRef.current[shop.id] ?? 'わからない'
        );
      });

      markers.addLayer(marker);
      markersRef.current.set(shop.id, marker);
    });

    const updateMarkerDensity = () => {
      const zoom = map.getZoom();
      const maxZoom = map.getMaxZoom() ?? zoom;
      const isMaxZoom = zoom >= maxZoom - 0.001;
      const showProductIcon = zoom >= maxZoom - 1 && !isMaxZoom;
      const showSimpleBanner = isMaxZoom;
      const useCompact = zoom <= COMPACT_ICON_MAX_ZOOM;
      const useMid = zoom > COMPACT_ICON_MAX_ZOOM && zoom <= MID_ICON_MAX_ZOOM;
      const nextMode: 'compact' | 'mid' | 'full' = useCompact
        ? 'compact'
        : useMid
          ? 'mid'
          : 'full';
      if (
        lastIconModeRef.current === nextMode &&
        lastProductIconVisibleRef.current === showProductIcon &&
        lastSimpleBannerVisibleRef.current === showSimpleBanner
      ) {
        return;
      }
      lastIconModeRef.current = nextMode;
      lastProductIconVisibleRef.current = showProductIcon;
      lastSimpleBannerVisibleRef.current = showSimpleBanner;

      markersRef.current.forEach((marker, shopId) => {
        let icon: L.DivIcon | undefined;

        // Retrieve or generate the required icon
        if (useCompact) {
          icon = compactIconsRef.current.get(shopId);
          if (!icon) {
            const shop = shopsMap.get(shopId);
            if (shop) {
              icon = createCompactIcon(shop);
              compactIconsRef.current.set(shopId, icon);
            }
          }
        } else if (useMid) {
          icon = midIconsRef.current.get(shopId);
          if (!icon) {
            const shop = shopsMap.get(shopId);
            if (shop) {
              icon = createMidIcon(shop);
              midIconsRef.current.set(shopId, icon);
            }
          }
        } else {
          // Full
          icon = fullIconsRef.current.get(shopId);
          if (!icon) {
            const shop = shopsMap.get(shopId);
            if (shop) {
              icon = createFullIcon(shop);
              fullIconsRef.current.set(shopId, icon);
            }
          }
        }

        if (icon) {
          marker.setIcon(icon);
          setMarkerFavorite(marker, favoriteSetRef.current.has(shopId));
          setMarkerRecipeIcons(marker, recipeIconsRef.current[shopId]);
          setMarkerProductIconVisibility(marker, showProductIcon);
          setMarkerSimpleBannerVisibility(marker, showSimpleBanner);
          setMarkerAttendanceLabel(
            marker,
            attendanceLabelsRef.current[shopId] ?? 'わからない'
          );
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
            if (consultHighlightSetRef.current.has(shopId)) {
              markerElement.classList.add('shop-marker-consult');
            } else {
              markerElement.classList.remove('shop-marker-consult');
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
            if (bagShopSetRef.current.has(shopId)) {
              markerElement.classList.add('shop-marker-bag');
            } else {
              markerElement.classList.remove('shop-marker-bag');
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
    consultHighlightSetRef.current = new Set(consultShopIds ?? []);
    const nextHighlights = consultHighlightSetRef.current;
    const prevHighlights = prevConsultHighlightSetRef.current;
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
        setMarkerConsultHighlight(marker, nextHighlights.has(id));
      }
    });

    prevConsultHighlightSetRef.current = nextHighlights;
  }, [consultShopIds]);

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
    bagShopSetRef.current = new Set(bagShopIds ?? []);
    const nextHighlights = bagShopSetRef.current;
    const prevHighlights = prevBagShopSetRef.current;
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
        setMarkerBag(marker, nextHighlights.has(id));
      }
    });

    prevBagShopSetRef.current = nextHighlights;
  }, [bagShopIds]);

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
