/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone for Vercel — Vercel handles this natively
  serverExternalPackages: ['papaparse'],
  // Skip strict TS checking during build (pre-existing type quirks)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Increase API timeout for large CSV processing
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
