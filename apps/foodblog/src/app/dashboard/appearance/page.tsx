import { Card, CardContent, buttonClassName } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppearanceForm } from '@/components/blog/appearance-form';
import { requireBlog } from '@/lib/blog/guards';
import { getThemeOption } from '@/lib/blog/themes';
import { blogPath } from '@/lib/tenant';

export const metadata: Metadata = {
  title: 'Appearance',
};

export default async function AppearancePage() {
  const { blog } = await requireBlog();
  const current = getThemeOption(blog.theme);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Appearance</h1>
          <p className="page-header__subtitle">
            Your food blog is using the <strong>{current.label}</strong> theme. Switching themes
            takes effect straight away and never touches your recipes.
          </p>
        </div>
        <div className="page-header__actions">
          <Link
            className={buttonClassName({ variant: 'secondary' })}
            href={blogPath(blog.subdomain)}
          >
            View your food blog
          </Link>
        </div>
      </div>

      <Card>
        <CardContent>
          <AppearanceForm currentTheme={blog.theme} />
        </CardContent>
      </Card>
    </div>
  );
}
