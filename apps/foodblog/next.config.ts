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
  async redirects() {
    return [
      // Blogs used to be served under a `/site` prefix; keep shared links alive.
      {
        source: '/site/:subdomain/:path*',
        destination: '/:subdomain/:path*',
        permanent: true,
      },
      {
        source: '/site/:subdomain',
        destination: '/:subdomain',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
