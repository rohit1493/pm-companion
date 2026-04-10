/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint 9 flat config is not yet supported by Next.js 14's built-in lint runner.
    // Run `next lint` separately with eslint.config.mjs for linting.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
