import { DashboardShell, buttonClassName } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { requireBlog } from '@/lib/blog/guards';
import { blogPath } from '@/lib/tenant';

import '@/styles/dashboard.css';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s · BlogHost' },
  robots: { index: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, blog } = await requireBlog();

  return (
    <DashboardShell
      navLabel="Food blog"
      brand={
        <Link className="dashboard-brand" href="/dashboard">
          <span aria-hidden="true">🍳</span>
          <span>
            <span className="dashboard-brand__blog">{blog.name}</span>
            <br />
            <span className="dashboard-brand__label">Food blog on BlogHost</span>
          </span>
        </Link>
      }
      nav={<DashboardNav />}
      topbarActions={
        <>
          <Link
            className={buttonClassName({
              variant: 'secondary',
              size: 'sm',
              className: 'dashboard-view-blog',
            })}
            href={blogPath(blog.subdomain)}
          >
            View blog
          </Link>
          <SignOutButton />
        </>
      }
      sidebarFooter={
        <p className="text-sm muted">
          Signed in as
          <br />
          {user.email}
        </p>
      }
    >
      {children}
    </DashboardShell>
  );
}
