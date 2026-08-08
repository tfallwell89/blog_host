import Link from 'next/link';

import { blogPath } from '@/lib/tenant';

import { SiteNav, type SiteNavPage } from './site-nav';

export interface SiteHeaderProps {
  blog: {
    name: string;
    logoUrl: string | null;
    subdomain: string;
  };
  activePage?: SiteNavPage;
}

/** The shared public blog header, also used by in-dashboard previews. */
export function SiteHeader({ blog, activePage }: SiteHeaderProps) {
  return (
    <header className="site__bar">
      <div className="site-container site__bar-inner">
        <Link className="site__brand" href={blogPath(blog.subdomain)}>
          {blog.logoUrl ? (
            <img className="site__logo" src={blog.logoUrl} alt={blog.name} />
          ) : (
            <span className="site__brand-name">{blog.name}</span>
          )}
        </Link>
        <SiteNav subdomain={blog.subdomain} activePage={activePage} />
      </div>
    </header>
  );
}
