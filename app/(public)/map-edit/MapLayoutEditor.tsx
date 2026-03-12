"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2 } from "lucide-react";
import type { Landmark as EditableLandmark } from "../map/types/landmark";
import type { Shop } from "../map/data/shops";
import RoadOverlay from "../map/components/RoadOverlay";
import BackgroundOverlay from "../map/components/BackgroundOverlay";
import OptimizedShopLayerWithClustering from "../map/components/OptimizedShopLayerWithClustering";

type EditableShop = {
  locationId: string;
  id: number;
  vendorId?: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  mode: "edit" | "preview";
  shops: EditableShop[];
  landmarks: EditableLandmark[];
  selectedKind: "shop" | "landmark";
  selectedId: string;
  onSelect: (kind: "shop" | "landmark", id: string) => void;
  onClearSelection: () => void;
  onMoveShop: (id: number, lat: number, lng: number) => void;
  onMoveLandmark: (key: string, lat: number, lng: number) => void;
  onDeleteShop: (id: number) => void;
  onDeleteLandmark: (key: string) => void;
};

function ClickCapture({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function createMarkerIcon(
  kind: "shop" | "landmark",
  isSelected: boolean,
  isUnassigned = false,
  isIncompleteLandmark = false
) {
  const size = isSelected ? 26 : 18;
  const borderRadius = kind === "shop" ? "9999px" : "6px";
  const background =
    kind === "shop"
      ? (isUnassigned ? "#94a3b8" : "#0284c7")
      : (isIncompleteLandmark ? "#c7926a" : "#f97316");
  const glow =
    kind === "shop"
      ? isUnassigned
        ? "rgba(148,163,184,.38)"
        : "rgba(2,132,199,.38)"
      : (isIncompleteLandmark ? "rgba(199,146,106,.38)" : "rgba(249,115,22,.38)");
  const outline = isSelected ? "0 0 0 6px rgba(255,255,255,.95), 0 0 0 10px rgba(15,23,42,.14)" : "";

  return L.divIcon({
    className: "custom-map-edit-icon",
    html: `<div style="width:${size}px;height:${size}px;border-radius:${borderRadius};background:${background};border:3px solid white;box-shadow:${outline ? `${outline}, ` : ""}0 6px 16px ${glow};transform:${isSelected ? "scale(1.05)" : "scale(1)"};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapLayoutEditor({
  mode,
  shops,
  landmarks,
  selectedKind,
  selectedId,
  onSelect,
  onClearSelection,
  onMoveShop,
  onMoveLandmark,
  onDeleteShop,
  onDeleteLandmark,
}: Props) {
  const center = useMemo<[number, number]>(() => {
    const first = shops[0] ?? landmarks[0];
    return first ? [first.lat, first.lng] : [33.56145, 133.5383];
  }, [landmarks, shops]);
  const maxZoom = 20;
  const shopIcons = useMemo(() => {
    const icons = new Map<number, L.DivIcon>();
    for (const shop of shops) {
      icons.set(
        shop.id,
        createMarkerIcon(
          "shop",
          selectedKind === "shop" && selectedId === String(shop.id),
          !shop.vendorId
        )
      );
    }
    return icons;
  }, [selectedId, selectedKind, shops]);
  const landmarkIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    for (const landmark of landmarks) {
      const isIncomplete = !landmark.name.trim() || !landmark.url.trim();
      icons.set(
        landmark.key,
        createMarkerIcon(
          "landmark",
          selectedKind === "landmark" && selectedId === landmark.key,
          false,
          isIncomplete
        )
      );
    }
    return icons;
  }, [landmarks, selectedId, selectedKind]);
  const previewShops = useMemo<Shop[]>(
    () =>
      shops
        .filter((shop) => shop.vendorId)
        .map((shop) => ({
        id: shop.id,
        vendorId: shop.vendorId,
        name: shop.name,
        ownerName: "",
        category: "",
        products: [],
        description: "",
        schedule: "",
        position: shop.id,
        lat: shop.lat,
        lng: shop.lng,
      })),
    [shops]
  );
  const previewLandmarkIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    for (const landmark of landmarks) {
      const width = Math.max(24, Math.round(landmark.widthPx * 0.36));
      const height = Math.max(24, Math.round(landmark.heightPx * 0.36));
      icons.set(
        landmark.key,
        L.divIcon({
          className: "map-landmark-icon",
          html: `<img class="map-landmark-visual" src="${landmark.url}" alt="" draggable="false" style="width:${width}px;height:${height}px;opacity:1;" />`,
          iconSize: [width, height],
          iconAnchor: [width / 2, height / 2],
        })
      );
    }
    return icons;
  }, [landmarks]);

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={17}
        maxZoom={maxZoom}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          maxZoom={maxZoom}
        />
        {mode === "preview" ? (
          <>
            <BackgroundOverlay />
            <RoadOverlay />
            {landmarks.map((landmark) => (
              <Marker
                key={landmark.key}
                position={[landmark.lat, landmark.lng]}
                icon={previewLandmarkIcons.get(landmark.key) ?? createMarkerIcon("landmark", false)}
              />
            ))}
            <OptimizedShopLayerWithClustering
              shops={previewShops}
              onShopClick={() => {}}
            />
          </>
        ) : (
          <>
            <ClickCapture
              onClick={() => {
                onClearSelection();
              }}
            />
            {shops.map((shop) => (
              <Marker
                key={shop.id}
                position={[shop.lat, shop.lng]}
                icon={shopIcons.get(shop.id) ?? createMarkerIcon("shop", false, !shop.vendorId)}
                draggable={selectedKind === "shop" && selectedId === String(shop.id)}
                eventHandlers={{
                  click: () => onSelect("shop", String(shop.id)),
                  dragend: (event) => {
                    const marker = event.target;
                    const latlng = marker.getLatLng();
                    onMoveShop(shop.id, latlng.lat, latlng.lng);
                  },
                }}
              >
                <Popup className="map-edit-marker-popup" closeButton={false} offset={[0, -12]}>
                  <div className="min-w-[180px]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shop</p>
                        <h3 className="mt-1 text-sm font-semibold text-slate-900">{shop.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">#{shop.id}</p>
                        {!shop.vendorId && (
                          <p className="mt-1 text-xs font-medium text-slate-400">出店者未割当</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteShop(shop.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        aria-label={`${shop.name} を削除`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {shop.lat.toFixed(6)}, {shop.lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {landmarks.map((landmark) => (
              <Marker
                key={landmark.key}
                position={[landmark.lat, landmark.lng]}
                icon={
                  landmarkIcons.get(landmark.key) ??
                  createMarkerIcon("landmark", false, false, !landmark.name.trim() || !landmark.url.trim())
                }
                draggable={selectedKind === "landmark" && selectedId === landmark.key}
                eventHandlers={{
                  click: () => onSelect("landmark", landmark.key),
                  dragend: (event) => {
                    const marker = event.target;
                    const latlng = marker.getLatLng();
                    onMoveLandmark(landmark.key, latlng.lat, latlng.lng);
                  },
                }}
              >
                <Popup className="map-edit-marker-popup" closeButton={false} offset={[0, -12]}>
                  <div className="min-w-[180px]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Landmark</p>
                        <h3 className="mt-1 text-sm font-semibold text-slate-900">{landmark.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteLandmark(landmark.key)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        aria-label={`${landmark.name} を削除`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {landmark.lat.toFixed(6)}, {landmark.lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}
