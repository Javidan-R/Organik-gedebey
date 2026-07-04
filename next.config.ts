// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'qadin.net', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [70, 70, 70, 70, 70, 75, 85],
  },
  serverExternalPackages: ['postgres', 'pg'],
  reactCompiler: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: ['localhost:3000', 'organikgedebey.com'],
    },
    optimizePackageImports: ['lucide-react', '@tanstack/react-query', 'framer-motion'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  // ✅ JSDoc ilə tip təyin edildi
  /**
   * @param {import('webpack').Configuration} config
   * @param {import('next/dist/server/config-shared').WebpackConfigContext} context
   * @returns {import('webpack').Configuration}
   */
  webpack: (config: import('webpack').Configuration, { isServer: _isServer }: import('next/dist/server/config-shared').WebpackConfigContext): import('webpack').Configuration => {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-query)[\\/]/,
            name: 'react-vendors',
            priority: 20,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };
    return config;
  },
  async headers() {
    if (process.env.NODE_ENV !== 'production') return [];

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Content-Encoding', value: 'gzip, deflate, br' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'CDN-Cache-Control', value: 'max-age=31536000' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;