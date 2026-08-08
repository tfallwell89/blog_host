'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { blogAboutPath, blogPath } from '@/lib/tenant';

export type SiteNavPage = 'recipes' | 'about';

export function SiteNav({
  subdomain,
  activePage,
}: {
  subdomain: string;
  /** Overrides route detection when the navigation is rendered in a preview. */
  activePage?: SiteNavPage;
}) {
  const pathname = usePathname();
  const home = blogPath(subdomain);
  const about = blogAboutPath(subdomain);

  const links = [
    {
      href: home,
      label: 'Recipes',
      active:
        activePage === 'recipes' ||
        (!activePage && (pathname === home || pathname.includes('/recipes'))),
    },
    {
      href: about,
      label: 'About',
      active: activePage === 'about' || (!activePage && pathname === about),
    },
  ];

  return (
    <nav className="site__nav" aria-label="Blog">
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.active ? 'page' : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
