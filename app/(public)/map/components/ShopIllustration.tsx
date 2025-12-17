/**
 * 店舗イラストコンポーネント
 *
 * 将来のイラスト差し替えに対応するため、type/size/colorでバリエーション管理
 * カスタムSVGの読み込みにも対応
 */

interface ShopIllustrationProps {
  type?: 'tent' | 'stall' | 'custom';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  customSvg?: string;
}

export default function ShopIllustration({
  type = 'tent',
  size = 'medium',
  color,
  customSvg,
}: ShopIllustrationProps) {
  // カスタムSVGが指定されている場合はそれを使用
  if (customSvg) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: customSvg }}
        className="shop-illustration"
      />
    );
  }

  // サイズ設定（将来の拡張用）
  const sizeMap = {
    small: { width: 40, height: 40 },
    medium: { width: 60, height: 60 },
    large: { width: 80, height: 80 },
  };
  const { width, height } = sizeMap[size];

  // デフォルトのテント型イラスト
  if (type === 'tent') {
    const tentColor = color || '#e74c3c';
    const tentDark = color ? adjustColor(color, -20) : '#c0392b';

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 60"
        width={width}
        height={height}
        className="shop-illustration"
      >
        {/* 影 */}
        <ellipse cx="30" cy="52" rx="25" ry="3" fill="#000" opacity="0.15"/>

        {/* テント屋根 */}
        <path
          d="M5 20 L30 10 L55 20 L50 25 L30 30 L10 25 Z"
          fill={tentColor}
          stroke={tentDark}
          strokeWidth="1.5"
        />

        {/* 店舗本体 */}
        <path
          d="M10 25 L10 50 L50 50 L50 25"
          fill="#ecf0f1"
          stroke="#95a5a6"
          strokeWidth="1.5"
        />

        {/* 商品棚 */}
        <rect
          x="15"
          y="30"
          width="30"
          height="15"
          fill="#f39c12"
          opacity="0.6"
        />
      </svg>
    );
  }

  // 屋台型イラスト（将来の拡張用）
  if (type === 'stall') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 60"
        width={width}
        height={height}
        className="shop-illustration"
      >
        <ellipse cx="30" cy="52" rx="25" ry="3" fill="#000" opacity="0.15"/>
        <rect x="10" y="20" width="40" height="30" fill="#ffffff" stroke="#95a5a6" strokeWidth="1.5" rx="2"/>
        <rect x="15" y="25" width="30" height="20" fill="#f39c12" opacity="0.6"/>
      </svg>
    );
  }

  // デフォルト（tent）
  return null;
}

// 色調整ヘルパー関数（将来の拡張用）
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
