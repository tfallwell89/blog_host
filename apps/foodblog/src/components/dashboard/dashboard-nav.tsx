'use client';

import { navLinkClassName } from '@bloghost/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '🏠' },
  { href: '/dashboard/recipes', label: 'Recipes', icon: '🥘' },
  { href: '/dashboard/appearance', label: 'Appearance', icon: '🎨' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={navLinkClassName({ active })}
            aria-current={active ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
