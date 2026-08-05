import nextPlugin from '@next/eslint-plugin-next';

import { reactLibraryConfig } from './react-library.js';

/**
 * Flat ESLint config for Next.js applications.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const nextConfig = [
  ...reactLibraryConfig,
  {
    // Registered without a `files` filter so `next build` can detect that the
    // Next.js plugin is active and skip its own duplicate lint pass warning.
    plugins: {
      '@next/next': nextPlugin,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];

export default nextConfig;
