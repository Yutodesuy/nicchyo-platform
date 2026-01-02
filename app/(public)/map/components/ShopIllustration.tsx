/**
 * Shop illustration component (DOM-based).
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
  if (customSvg) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: customSvg }}
        className="shop-illustration"
      />
    );
  }

  const sizeMap = {
    small: { width: 40, height: 40 },
    medium: { width: 60, height: 60 },
    large: { width: 80, height: 80 },
  };
  const { width, height } = sizeMap[size];

  const baseColor = color || '#22c55e';
  const darkColor = adjustColor(baseColor, -25);
  const lightColor = adjustColor(baseColor, 25);

  if (type === 'custom') {
    return null;
  }

  return (
    <div
      className="shop-illustration shop-illustration-3d"
      style={{
        width,
        height,
        ['--stall-color' as any]: baseColor,
        ['--stall-color-dark' as any]: darkColor,
        ['--stall-color-light' as any]: lightColor,
      }}
    >
      <div className="stall-shadow" aria-hidden="true" />
      <div className="stall-roof" aria-hidden="true" />
      <div className="stall-awning" aria-hidden="true" />
      <div className="stall-body" aria-hidden="true" />
      <div className="stall-counter" aria-hidden="true" />
      <div className="stall-legs" aria-hidden="true" />
    </div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
