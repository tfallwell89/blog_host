import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteNav } from '@/components/site/site-nav';
import { brandColorStyle } from '@/lib/blog/brand';
import { getBlogBySubdomain } from '@/lib/blog/queries';
import { blogPath } from '@/lib/tenant';

import '@/styles/site.css';

interface TenantParams {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: TenantParams): Promise<Metadata> {
  const { subdomain } = await params;
  const blog = await getBlogBySubdomain(subdomain);

  if (!blog) {
    return { title: 'Food blog not found' };
  }

  return {
    title: { default: blog.name, template: `%s · ${blog.name}` },
    description: blog.description,
    alternates: { canonical: blogPath(blog.subdomain) },
    openGraph: {
      type: 'website',
      siteName: blog.name,
      title: blog.name,
      description: blog.description,
      url: blogPath(blog.subdomain),
    },
  };
}

export default async function SiteLayout({
  children,
  params,
}: TenantParams & { children: React.ReactNode }) {
  const { subdomain } = await params;
  const blog = await getBlogBySubdomain(subdomain);

  if (!blog) {
    notFound();
  }

  const home = blogPath(blog.subdomain);

  return (
    <div className="site" style={brandColorStyle(blog.brandColor)}>
      <a className="skip-link" href="#site-main">
        Skip to content
      </a>

      <header className="site__bar">
        <div className="site-container site__bar-inner">
          <Link className="site__brand" href={home}>
            {blog.logoUrl ? (
              <img className="site__logo" src={blog.logoUrl} alt={blog.name} />
            ) : (
              <span className="site__brand-name">{blog.name}</span>
            )}
          </Link>
          <SiteNav subdomain={blog.subdomain} />
        </div>
      </header>

      <main className="site__main" id="site-main">
        <div className="site-container">{children}</div>
      </main>

      <footer className="site__footer">
        <div className="site-container">
          <p>
            © {new Date().getFullYear()} {blog.name} · Recipes by {blog.authorName}
          </p>
          <p>
            Published with <Link href="/">BlogHost</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
