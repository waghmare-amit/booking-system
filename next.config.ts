import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Show TypeScript errors in the terminal but don't block the dev server
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint only runs during `npm run build`, not `npm run dev`
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
