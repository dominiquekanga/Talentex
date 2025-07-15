/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour le développement
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Améliorer le hot-reload
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Configuration des images
  images: {
    domains: [
      'localhost',
      'res.cloudinary.com',
      'images.unsplash.com',
      'via.placeholder.com',
    ],
  },
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://backend:5001',
    NEXT_PUBLIC_APP_NAME: 'TalentEx',
  },
  // Rewrites pour l'API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://backend:5001'}/api/:path*`,
      },
    ];
  },
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Configuration pour le développement
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  // Optimisations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig; 