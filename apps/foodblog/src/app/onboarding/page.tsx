import { Card, CardContent } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { OnboardingForm } from '@/components/blog/onboarding-form';
import { requireUser } from '@/lib/auth/guards';
import { getBlogForUser } from '@/lib/blog/queries';

import '@/styles/dashboard.css';

export const metadata: Metadata = {
  title: 'Name your food blog',
  description: 'Create your hosted food blog in three short steps.',
  robots: { index: false },
};

export default async function OnboardingPage() {
  const user = await requireUser();

  // One blog per account for now — returning owners go straight to work.
  const existingBlog = await getBlogForUser(user.id);
  if (existingBlog) {
    redirect('/dashboard');
  }

  return (
    <main className="onboarding">
      <div className="page page--narrow stack stack--lg">
        <div className="onboarding__intro">
          <Link className="auth__brand" href="/">
            🍳 BlogHost
          </Link>
          <h1 className="onboarding__title">Let&rsquo;s set up your food blog</h1>
          <p className="section__lede">
            Three quick answers, {user.displayName.split(' ')[0]}, and your blog is live. You can
            change any of it later.
          </p>
        </div>

        <Card>
          <CardContent>
            <OnboardingForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
