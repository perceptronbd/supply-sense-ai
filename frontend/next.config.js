//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");
const path = require("path");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Bundle optimization
  compress: true,
  
  // Enable experimental optimizations
  experimental: {
    optimizePackageImports: [
      '@heroui/react',
      '@heroicons/react',
      'framer-motion',
      'react-redux',
      'date-fns',
      'lucide-react'
    ],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Resolve alias
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };

    // Configure cache settings to prevent cache inclusion in build output
    if (!dev) {
      // Ensure webpack cache is properly isolated for production builds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        // Cache directory is automatically managed by Next.js
        // and should not be included in the build output
      };
    }

    if (!dev) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // ~240KB chunks
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              maxSize: 244000,
            },
          },
        },
      };

      // Tree shaking for UI libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        '@heroui/react': '@heroui/react',
        '@heroicons/react/24/outline': '@heroicons/react/24/outline/index.esm.js',
        '@heroicons/react/24/solid': '@heroicons/react/24/solid/index.esm.js',
      };

      // Bundle analyzer (only when analyzing)
      if (process.env.ANALYZE === 'true') {
        const withBundleAnalyzer = require('@next/bundle-analyzer')({
          enabled: true,
        });
        return withBundleAnalyzer(config);
      }
    }

    return config;
  },
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  
  // Only include necessary polyfills
  transpilePackages: [
    '@heroui/react',
    '@heroui/theme',
    '@heroui/system',
    '@heroui/system-rsc'
  ],
  
  // Clean up cache after build to prevent it from being copied to dist
  async rewrites() {
    return [];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
