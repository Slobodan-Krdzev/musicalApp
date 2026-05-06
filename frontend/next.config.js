/** @type {import('next').NextConfig} */
const API_TARGET = process.env.API_TARGET || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  /**
   * Use in-memory webpack cache in dev only. The default filesystem pack cache
   * can desync (stale chunk IDs, missing ./NNN.js, 404 on layout.css / main-app.js)
   * after interrupted compiles, concurrent build+dev, or multiple dev servers.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: 'memory' };
    }
    return config;
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_TARGET}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_TARGET}/uploads/:path*` },
    ];
  },
};

module.exports = nextConfig;
