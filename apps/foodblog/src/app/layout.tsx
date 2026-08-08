import type { Metadata, Viewport } from 'next';
import { Source_Serif_4 } from 'next/font/google';

import { appOrigin } from '@/lib/tenant';

import '@bloghost/ui/styles.css';
import './globals.css';

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin()),
  title: {
    default: 'BlogHost — Start your very own food blog in 10 minutes',
    template: '%s · BlogHost',
  },
  description:
    'BlogHost is hosted food-blog software. Name your blog, choose a design and publish your first recipe today — no WordPress, plugins, hosting or code.',
  openGraph: {
    type: 'website',
    siteName: 'BlogHost',
  },
};

export const viewport: Viewport = {
  themeColor: '#c2410c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={sourceSerif.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
