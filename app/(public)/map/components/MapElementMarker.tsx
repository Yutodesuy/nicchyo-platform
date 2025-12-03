'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { AnyMapElement } from '../types/mapElements';

interface MapElementMarkerProps {
  element: AnyMapElement;
}

/**
 * マップ要素をマーカーとして表示するコンポーネント
 *
 * 手書きマップ上に配置する店舗、人、商品、建物などの要素を
 * カスタムアイコンとして表示します。
 */
export default function MapElementMarker({ element }: MapElementMarkerProps) {
  // カスタムアイコンの作成
  const customIcon = L.divIcon({
    html: `
      <div style="
        width: ${element.size?.width || 50}px;
        height: ${element.size?.height || 50}px;
        position: relative;
        transform: rotate(${element.rotation || 0}deg);
        opacity: ${element.opacity || 1};
      ">
        <img
          src="${element.imagePath}"
          alt="${element.name}"
          style="
            width: 100%;
            height: 100%;
            object-fit: contain;
          "
        />
      </div>
    `,
    className: 'custom-map-element-icon',
    iconSize: [element.size?.width || 50, element.size?.height || 50],
    iconAnchor: [(element.size?.width || 50) / 2, (element.size?.height || 50) / 2],
  });

  return (
    <Marker
      position={[element.coordinates.lat, element.coordinates.lng]}
      icon={customIcon}
      zIndexOffset={element.zIndex || 0}
    >
      <Popup>
        <div className="text-center">
          <strong className="block mb-1">{element.name}</strong>
          {element.description && (
            <p className="text-xs text-gray-600 mb-2">{element.description}</p>
          )}
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {getCategoryLabel(element.category)}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * カテゴリーの日本語ラベルを取得
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    shop: '店舗',
    person: '人',
    product: '商品',
    building: '建物',
  };
  return labels[category] || category;
}
