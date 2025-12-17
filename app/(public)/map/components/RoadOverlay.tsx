/**
 * 道路オーバーレイコンポーネント
 *
 * 【責務】
 * - 日曜市の道（通り）を地図上に表示
 * - 店舗イラストより下のレイヤーに配置
 * - イラスト差し替えに対応
 *
 * 【レイヤー構造】
 * Layer 0: Leafletベースマップ
 * Layer 1: BackgroundOverlay（将来の拡張用）
 * → Layer 2: RoadOverlay ← このコンポーネント
 * Layer 3: ShopMarker（店舗イラスト）
 * Layer 4: UI層
 */

'use client';

import { ImageOverlay, SVGOverlay } from 'react-leaflet';
import { ROAD_CONFIG, RoadConfig } from '../config/roadConfig';
import { LatLngBoundsExpression } from 'leaflet';

export default function RoadOverlay() {
  const config = ROAD_CONFIG;

  // プレースホルダー（仮の道）を表示
  if (config.type === 'placeholder') {
    return <PlaceholderRoad config={config} />;
  }

  // カスタムイラストを表示
  if (config.type === 'custom' && config.imagePath) {
    return (
      <ImageOverlay
        url={config.imagePath}
        bounds={config.bounds as LatLngBoundsExpression}
        opacity={config.opacity}
        zIndex={config.zIndex}
      />
    );
  }

  // イラスト指定（SVGまたは画像）
  if (config.type === 'illustration' && config.imagePath) {
    return (
      <ImageOverlay
        url={config.imagePath}
        bounds={config.bounds as LatLngBoundsExpression}
        opacity={config.opacity}
        zIndex={config.zIndex}
      />
    );
  }

  return null;
}

/**
 * プレースホルダー道路コンポーネント
 *
 * 実際の道のイラストができるまでの仮実装
 * シンプルな道路を SVGOverlay で描画
 */
function PlaceholderRoad({ config }: { config: RoadConfig }) {
  const [[latNW, lngNW], [latSE, lngSE]] = config.bounds;

  // SVG要素を生成
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 1000" preserveAspectRatio="none">
      <!-- 背景（道路の地面） -->
      <rect x="0" y="0" width="100" height="1000" fill="#d4c5b0" opacity="0.9"/>

      <!-- 道路の縁石（左） -->
      <line x1="20" y1="0" x2="20" y2="1000" stroke="#9a8a7a" stroke-width="1" opacity="0.6"/>

      <!-- 道路の縁石（右） -->
      <line x1="80" y1="0" x2="80" y2="1000" stroke="#9a8a7a" stroke-width="1" opacity="0.6"/>

      <!-- 中央線（破線） -->
      <line x1="50" y1="0" x2="50" y2="1000" stroke="#a89070" stroke-width="0.5" stroke-dasharray="10,10" opacity="0.4"/>

      <!-- 微細なテクスチャ（道の質感） -->
      <rect x="0" y="0" width="100" height="1000" fill="url(#roadTexture)" opacity="0.1"/>

      <defs>
        <pattern id="roadTexture" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.5" fill="#8a7a6a"/>
          <circle cx="7" cy="6" r="0.5" fill="#8a7a6a"/>
        </pattern>
      </defs>
    </svg>
  `;

  // SVGをData URLに変換（UTF-8エンコード対応）
  const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;

  return (
    <ImageOverlay
      url={svgDataUrl}
      bounds={config.bounds as LatLngBoundsExpression}
      opacity={config.opacity}
      zIndex={config.zIndex}
    />
  );
}
