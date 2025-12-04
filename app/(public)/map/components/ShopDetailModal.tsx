'use client';

import { Shop } from '../data/shops';

interface ShopDetailModalProps {
  shop: Shop | null;
  onClose: () => void;
}

export default function ShopDetailModal({ shop, onClose }: ShopDetailModalProps) {
  if (!shop) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{shop.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{shop.name}</h2>
                <p className="text-sm text-blue-100">{shop.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* 説明 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              お店について
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {shop.description}
            </p>
          </div>

          {/* 取扱商品 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              取扱商品
            </h3>
            <div className="flex flex-wrap gap-2">
              {shop.products.map((product, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>

          {/* 位置情報 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              位置情報
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">場所:</span>{' '}
                {shop.side === 'north' ? '北側（左側）' : '南側（右側）'}
              </p>
              <p>
                <span className="font-medium">番号:</span> {shop.position + 1}
                番目
              </p>
            </div>
          </div>

          {/* フッター */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
