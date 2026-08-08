import { Card, CardContent, buttonClassName } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppearanceForm } from '@/components/blog/appearance-form';
import { requireBlog } from '@/lib/blog/guards';
import { blogPath } from '@/lib/tenant';

export const metadata: Metadata = {
  title: 'Appearance',
};

export default async function AppearancePage() {
  const { blog } = await requireBlog();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Appearance</h1>
          <p className="page-header__subtitle">
            Add your logo and pick the colour readers will associate with your food blog. Changes
            take effect straight away and never touch your recipes.
          </p>
        </div>
        <div className="page-header__actions">
          <Link
            className={buttonClassName({
              variant: 'secondary',
              className: 'dashboard-view-blog',
            })}
            href={blogPath(blog.subdomain)}
          >
            View your food blog
          </Link>
        </div>
      </div>

      <Card>
        <CardContent>
          <AppearanceForm
            blog={{
              id: blog.id,
              name: blog.name,
              logoUrl: blog.logoUrl,
              brandColor: blog.brandColor,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
