"use client";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
}: Props) {
  const center = useMemo<[number, number]>(() => {
    const first = shops[0] ?? landmarks[0];
    return first ? [first.lat, first.lng] : [33.56145, 133.5383];
  }, [landmarks, shops]);

  return (
    <div className="h-[70vh] w-full">
      <MapContainer center={center} zoom={17} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
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
          />
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
          />
        ))}
      </MapContainer>
    </div>
  );
}
