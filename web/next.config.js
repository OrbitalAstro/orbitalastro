/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable static page generation - all pages are dynamic
  // `output: 'standalone'` breaks `next dev` on Windows with missing server chunks
  // (e.g. "Cannot find module './948.js'"). Keep it for production builds only.
  ...(isProd ? { output: 'standalone' } : {}),
  // Skip static generation during build
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig









