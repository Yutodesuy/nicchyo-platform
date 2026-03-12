"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2 } from "lucide-react";
import type { Landmark as EditableLandmark } from "../map/types/landmark";

type EditableShop = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  shops: EditableShop[];
  landmarks: EditableLandmark[];
  selectedKind: "shop" | "landmark";
  selectedId: string;
  onSelect: (kind: "shop" | "landmark", id: string) => void;
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

const shopIcon = L.divIcon({
  className: "custom-map-edit-icon",
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#0284c7;border:3px solid white;box-shadow:0 4px 10px rgba(2,132,199,.35);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const landmarkIcon = L.divIcon({
  className: "custom-map-edit-icon",
  html: '<div style="width:18px;height:18px;border-radius:6px;background:#f97316;border:3px solid white;box-shadow:0 4px 10px rgba(249,115,22,.35);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function MapLayoutEditor({
  shops,
  landmarks,
  selectedKind,
  selectedId,
  onSelect,
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

  return (
    <div className="h-[70vh] w-full">
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
        <ClickCapture
          onClick={(lat, lng) => {
            if (selectedKind === "landmark" && selectedId) {
              onMoveLandmark(selectedId, lat, lng);
            }
          }}
        />
        {shops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            icon={shopIcon}
            draggable
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
            icon={landmarkIcon}
            draggable
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
      </MapContainer>
    </div>
  );
}
