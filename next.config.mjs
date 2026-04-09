/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone for Vercel — Vercel handles this natively
  serverExternalPackages: ['papaparse'],
  // Increase API timeout for large CSV processing
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
