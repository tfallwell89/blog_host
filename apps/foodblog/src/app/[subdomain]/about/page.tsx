import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBlogBySubdomain } from '@/lib/blog/queries';
import { blogAboutPath, blogPath } from '@/lib/tenant';

interface TenantParams {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: TenantParams): Promise<Metadata> {
  const { subdomain } = await params;
  const blog = await getBlogBySubdomain(subdomain);

  if (!blog) return { title: 'Food blog not found' };

  return {
    title: 'About',
    description: `About ${blog.name} — ${blog.description}`,
    alternates: { canonical: blogAboutPath(blog.subdomain) },
  };
}

export default async function AboutPage({ params }: TenantParams) {
  const { subdomain } = await params;
  const blog = await getBlogBySubdomain(subdomain);

  if (!blog) {
    notFound();
  }

  return (
    <div className="site-container--narrow about">
      <h1>About {blog.name}</h1>
      <p>{blog.description}</p>
      <p>
        {blog.name} is written by {blog.authorName}. Every recipe here has been cooked, eaten and
        written up by hand — no shortcuts, no untested measurements.
      </p>
      <p>
        The best way to follow along is simply to keep cooking from the recipe index. New recipes
        appear there as soon as they are published.
      </p>
      <p>
        <Link href={blogPath(blog.subdomain)}>Browse all recipes</Link>
      </p>
    </div>
  );
}
