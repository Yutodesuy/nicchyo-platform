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
} from '../config/displayConfig';

interface ShopMarkerProps {
  shop: Shop;
  onClick: (shop: Shop) => void;
  isSelected?: boolean;
  planOrderIndex?: number;
  isFavorite?: boolean;
}

export default function ShopMarker({ shop, onClick, isSelected, planOrderIndex, isFavorite }: ShopMarkerProps) {
  const ORDER_SYMBOLS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];

  // 【動的サイズ取得】店舗データまたはデフォルト設定からサイズを決定
  const sizeKey = shop.illustration?.size ?? DEFAULT_ILLUSTRATION_SIZE;
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
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
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
  const customIcon = divIcon({
    html: iconMarkup,
    className: 'custom-shop-marker', // デフォルトスタイルを無効化
    iconSize: [sizeConfig.width, sizeConfig.height],
    iconAnchor: sizeConfig.anchor,
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
  const colorMap: Record<string, string> = {
    '野菜': '#2ecc71',
    '魚介': '#3498db',
    '果物': '#e74c3c',
    '花': '#e91e63',
    '主食': '#f39c12',
    '乳製品': '#f1c40f',
    '飲料': '#9b59b6',
    '工芸品': '#34495e',
    '衣類': '#1abc9c',
    '加工品': '#e67e22',
  };

  return colorMap[category] || '#e74c3c';
}
