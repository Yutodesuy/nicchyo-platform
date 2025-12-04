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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 sticky top-0 z-10">
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
              aria-label="閉じる"
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
        <div className="p-6 space-y-5">
          {/* 店主情報 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👤</span>
              <h3 className="text-sm font-semibold text-gray-800">店主</h3>
            </div>
            <p className="text-gray-700 font-medium ml-7">{shop.ownerName}</p>
          </div>

          {/* 出店予定 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📅</span>
              <h3 className="text-sm font-semibold text-gray-700">出店予定</h3>
            </div>
            <p className="text-gray-600 text-sm ml-7 bg-blue-50 inline-block px-3 py-1.5 rounded-lg">
              {shop.schedule}
            </p>
          </div>

          {/* 取扱商品 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🛒</span>
              <h3 className="text-sm font-semibold text-gray-700">取扱商品</h3>
            </div>
            <div className="flex flex-wrap gap-2 ml-7">
              {shop.products.map((product, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>

          {/* お店について */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">ℹ️</span>
              <h3 className="text-sm font-semibold text-gray-700">お店について</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed ml-7">
              {shop.description}
            </p>
          </div>

          {/* 出店者の思い（ある場合のみ） */}
          {shop.message && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💬</span>
                <h3 className="text-sm font-semibold text-gray-800">出店者の思い</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed italic ml-7">
                「{shop.message}」
              </p>
            </div>
          )}

          {/* 位置情報 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📍</span>
              <h3 className="text-sm font-semibold text-gray-700">位置情報</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-1 ml-7">
              <p>
                <span className="font-medium text-gray-700">場所:</span>{' '}
                {shop.side === 'north' ? '北側（左側）' : '南側（右側）'}
              </p>
              <p>
                <span className="font-medium text-gray-700">番号:</span>{' '}
                {shop.side === 'north' ? 'N' : 'S'}-{shop.position + 1}
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
