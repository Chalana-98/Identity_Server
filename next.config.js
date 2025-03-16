/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' as it's not compatible with API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;