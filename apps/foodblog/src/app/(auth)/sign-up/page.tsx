import { Card, CardContent } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { SignUpForm } from '@/components/auth/sign-up-form';
import { redirectIfAuthenticated } from '@/lib/auth/guards';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create a BlogHost account and start your food blog in ten minutes.',
  robots: { index: false },
};

export default async function SignUpPage() {
  await redirectIfAuthenticated();

  return (
    <main className="auth">
      <Link className="auth__brand" href="/">
        🍳 BlogHost
      </Link>

      <Card className="auth__card">
        <CardContent>
          <h1 className="ui-card__title">Start your food blog</h1>
          <p className="auth__intro">
            Create an account, then name your blog and publish your first recipe.
          </p>
          <SignUpForm />
        </CardContent>
      </Card>

      <p className="auth__footer">
        Already have a food blog? <Link href="/sign-in">Sign in</Link>
      </p>
    </main>
  );
}
