/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Leaflet が開発モードで二重初期化されるのを防ぐ

  // 画像最適化設定
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 秒単位でのキャッシュ時間
  },

  // 本番環境の圧縮設定
  compress: true,

  // パフォーマンス最適化
  poweredByHeader: false, // X-Powered-By ヘッダーを無効化（セキュリティ向上）

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
