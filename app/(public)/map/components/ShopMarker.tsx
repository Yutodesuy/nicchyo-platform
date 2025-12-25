/**
 * 店舗マーカーコンポーネント
 *
 * 【重要】このコンポーネントが「1店舗 = 1描画単位 + 1当たり判定」を実現します
 *
 * - 店舗イラスト
 * - 商品吹き出し
 * - クリック/ホバー当たり判定
 * を完全に一体化し、イラストそのものがクリック可能
 *
 * 将来のイラスト差し替え・サイズ変更に自動対応
 */

'use client';

import { Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shop } from '../data/shops';
import ShopIllustration from './ShopIllustration';
import ShopBubble from './ShopBubble';
import {
  DEFAULT_ILLUSTRATION_SIZE,
  ILLUSTRATION_SIZES,
  getIllustrationSizeForZoom,
} from '../config/displayConfig';

interface ShopMarkerProps {
  shop: Shop;
  onClick: (shop: Shop) => void;
  isSelected?: boolean;
  planOrderIndex?: number;
  isFavorite?: boolean;
  currentZoom?: number;  // 【Phase 3.5】動的サイズ調整用
}

export default function ShopMarker({ shop, onClick, isSelected, planOrderIndex, isFavorite, currentZoom }: ShopMarkerProps) {
  const ORDER_SYMBOLS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];

  // 【Phase 3.5】動的サイズ取得：ズームレベルに応じたサイズを決定
  // - ズーム17.5以上: medium (60px) - 詳細表示に適したサイズ
  // - ズーム16.0-17.5: small (40px) - 重なり防止
  // - ズーム16.0未満: small (40px) - 重なり防止最優先
  let sizeKey: 'small' | 'medium' | 'large';
  if (currentZoom !== undefined) {
    // ズームレベルが提供されている場合は、動的にサイズを決定
    sizeKey = getIllustrationSizeForZoom(currentZoom);
  } else {
    // フォールバック: 店舗データまたはデフォルト設定からサイズを決定
    sizeKey = shop.illustration?.size ?? DEFAULT_ILLUSTRATION_SIZE;
  }
  const sizeConfig = ILLUSTRATION_SIZES[sizeKey];

  // 店舗イラスト + 吹き出しを含むHTML文字列を生成
  const iconMarkup = renderToStaticMarkup(
    <div
      className="shop-marker-container"
      style={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      }}
    >
      {/* 商品吹き出し */}
      <ShopBubble
        icon={shop.icon}
        products={shop.products}
        side={shop.side}
        offset={sizeConfig.bubbleOffset}
      />

      {/* プランマーカー（エージェントプランがある場合） */}
      {planOrderIndex !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            color: '#92400e',
            border: '2px solid #fbbf24',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
        >
          {ORDER_SYMBOLS[planOrderIndex] ?? `${planOrderIndex + 1}`}
        </div>
      )}

      {/* お気に入りマーカー */}
      {isFavorite && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-15px',
            backgroundColor: '#fdf2f8',
            color: '#db2777',
            border: '2px solid #fbcfe8',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
        >
          ♥
        </div>
      )}

      {/* 店舗イラスト本体 */}
      <div
        className={`shop-illustration-wrapper ${isSelected ? 'selected' : ''}`}
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          transition: 'all 0.2s ease',
        }}
      >
        <ShopIllustration
          type={shop.illustration?.type ?? 'tent'}
          size={sizeKey}
          color={shop.illustration?.color ?? getCategoryColor(shop.category)}
          customSvg={shop.illustration?.customSvg}
        />
      </div>
    </div>
  );

  // Leaflet DivIconを作成（動的サイズ使用）
  // 選択時は1.1倍に拡大し、当たり判定も同時に拡大
  const sizeMultiplier = isSelected ? 1.1 : 1.0;
  const customIcon = divIcon({
    html: iconMarkup,
    className: 'custom-shop-marker', // デフォルトスタイルを無効化
    iconSize: [
      sizeConfig.width * sizeMultiplier,
      sizeConfig.height * sizeMultiplier
    ],
    iconAnchor: [
      sizeConfig.anchor[0] * sizeMultiplier,
      sizeConfig.anchor[1] * sizeMultiplier
    ],
  });

  return (
    <Marker
      position={[shop.lat, shop.lng]}
      icon={customIcon}
      eventHandlers={{
        click: () => onClick(shop),
      }}
    />
  );
}

/**
 * カテゴリーごとに店舗イラストの色を変える
 * 将来、カラーパレットをデータ化することも可能
 */
function getCategoryColor(category: string): string {
  // グリーン系で統一。カテゴリーで微調整のみ。
  const colorMap: Record<string, string> = {
    '食材': '#22c55e',
    '食べ物': '#16a34a',
    '道具・工具': '#15803d',
    '生活雑貨': '#22c55e',
    '植物・苗': '#16a34a',
    'アクセサリー': '#22c55e',
    '手作り・工芸': '#15803d',
  };

  return colorMap[category] || '#22c55e';
}

