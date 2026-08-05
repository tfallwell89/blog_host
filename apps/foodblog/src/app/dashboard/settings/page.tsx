import { Badge, Card, CardContent, CardHeader } from '@bloghost/ui';
import type { Metadata } from 'next';

import { SettingsForm } from '@/components/blog/settings-form';
import { requireBlog } from '@/lib/blog/guards';
import { blogUrl } from '@/lib/tenant';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
  const { user, blog } = await requireBlog();

  return (
    <div className="settings-grid">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Settings</h1>
          <p className="page-header__subtitle">
            Details about your food blog and how readers find it.
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <SettingsForm blog={blog} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Custom domain"
          description="Use your own domain, for example janeskitchen.com, instead of a BlogHost address."
          action={<Badge tone="neutral">Coming soon</Badge>}
        />
        <CardContent>
          <div className="coming-soon">
            <p className="muted text-sm">
              Your food blog is currently served from <code>{blogUrl(blog.subdomain)}</code>. Custom
              domains are not available yet — we will email {user.email} when they are.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
