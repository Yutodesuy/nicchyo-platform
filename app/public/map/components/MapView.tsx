'use client';

import { MapContainer, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// import MapElementMarker from './MapElementMarker';
// import { getAllElements } from '../data/sampleElements';

// 高知市日曜市の中心地点
const KOCHI_SUNDAY_MARKET: [number, number] = [33.559154, 133.531113];
const INITIAL_ZOOM = 17;  // 初期表示のズームレベル
const MIN_ZOOM = 16;      // 最小ズーム（縮小しすぎない）
const MAX_ZOOM = 19;      // 最大ズーム（拡大しすぎない）

// 手書きマップ画像のパス
// 手書きマップ完成後、以下のパスを実際の画像ファイルに変更してください
// 例: '/images/maps/nicchyo-handdrawn-map.png'
const HANDDRAWN_MAP_IMAGE = '/images/maps/placeholder-map.svg';

// 手書きマップの表示範囲（日曜市周辺の座標）
// 日曜市は追手筋沿いに約1.3km続くため、縦長に設定
// 余白を減らすため、左右の範囲も広げる
// 手書きマップ完成後、実際の地図の範囲に合わせて調整してください
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [33.5650, 133.5350], // 北東（北側・東側を広げる）
  [33.5530, 133.5270], // 南西（南側・西側を広げる）
];

// 移動可能範囲を制限（道路の中心を固定するため、横方向の移動を最小限に）
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [33.5680, 133.5370], // 北東（縦方向は広く）
  [33.5500, 133.5250], // 南西（横方向は狭く）
];

export default function MapView() {
  return (
    <div className="h-full w-full">
      <MapContainer
        center={KOCHI_SUNDAY_MARKET}
        zoom={INITIAL_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#faf8f3'
        }}
        zoomControl={true}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        {/*
          手書きマップをLeafletのImageOverlayとして表示
          ドラッグやズームで自由に動かせます
          手書きマップ完成後、HANDDRAWN_MAP_IMAGE のパスを更新してください

          ※ ベースマップ（OpenStreetMapなど）は使用しません
          　 位置の正確性よりも、手書きマップの雰囲気を重視します
        */}
        <ImageOverlay
          url={HANDDRAWN_MAP_IMAGE}
          bounds={MAP_BOUNDS}
          opacity={1}
          zIndex={10}
        />

        {/*
          マップ要素の表示（店舗、人、商品、建物など）
          実際の要素データが揃ったら、以下のコメントを外して使用してください

          {getAllElements().map((element) => (
            <MapElementMarker key={element.id} element={element} />
          ))}
        */}
      </MapContainer>
    </div>
  );
}
