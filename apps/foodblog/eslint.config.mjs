import { nextConfig } from '@bloghost/config-eslint/next';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // Featured images are arbitrary external URLs supplied by blog owners,
      // so they are rendered with a plain <img> instead of the image optimizer.
      '@next/next/no-img-element': 'off',
    },
  },
];
