/** @type {import('next').NextConfig | ((phase: string) => import('next').NextConfig)} */
const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} = require('next/constants')

/** Swagger FastAPI : même logique que `web/lib/site.ts` → getApiDocsUrl */
function getApiDocsDestination() {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'https://api.orbitalastro.ca')
    .trim()
    .replace(/\/+$/, '')
  return `${base}/docs`
}

const createConfig = (phase) => {
  const isProdBuild = phase === PHASE_PRODUCTION_BUILD
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER

  return {
    // Avoid Windows dev crashes by isolating dev artifacts from `next build` output.
    // Running `next build` while `next dev` is running can corrupt `.next` and cause missing server chunks.
    distDir: isDevServer ? '.next-dev' : '.next',
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
    // (e.g. "Cannot find module './948.js'"). Keep it ONLY for production builds.
    ...(isProdBuild ? { output: 'standalone' } : {}),
    // Skip static generation during build
    generateBuildId: async () => {
      return 'build-' + Date.now()
    },
    async redirects() {
      return [
        {
          source: '/docs',
          destination: getApiDocsDestination(),
          permanent: false,
        },
      ]
    },
    env: {
      API_URL: process.env.API_URL || 'http://localhost:8000',
    },
  }
}

module.exports = createConfig






