'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { blogAboutPath, blogPath } from '@/lib/tenant';

export function SiteNav({ subdomain }: { subdomain: string }) {
  const pathname = usePathname();
  const home = blogPath(subdomain);
  const about = blogAboutPath(subdomain);

  const links = [
    { href: home, label: 'Recipes', active: pathname === home || pathname.includes('/recipes') },
    { href: about, label: 'About', active: pathname === about },
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
