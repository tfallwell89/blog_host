import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/site/site-header';
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

  return (
    <div className="site" style={brandColorStyle(blog.brandColor)}>
      <a className="skip-link" href="#site-main">
        Skip to content
      </a>

      <SiteHeader blog={blog} />

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
