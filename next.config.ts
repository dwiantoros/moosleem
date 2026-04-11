import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Enable Turbopack caching
  turbopack: {
    resolveAlias: {},
  },

  // Response headers for caching
  async headers() {
    return [
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },

  // Redirects for old routes
  async redirects() {
    return [
      {
        source: '/mosques',
        destination: '/masjid',
        permanent: true,
      },
      {
        source: '/restaurants',
        destination: '/restoran-halal',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
