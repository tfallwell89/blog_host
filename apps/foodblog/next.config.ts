import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source and are compiled by the app.
  transpilePackages: ['@bloghost/ui'],
  typedRoutes: false,
  experimental: {
    // Server Actions receive whole recipe documents from the editor.
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
