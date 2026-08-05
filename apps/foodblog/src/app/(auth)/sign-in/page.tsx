import { Card, CardContent } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { SignInForm } from '@/components/auth/sign-in-form';
import { redirectIfAuthenticated } from '@/lib/auth/guards';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your BlogHost food blog dashboard.',
  robots: { index: false },
};

export default async function SignInPage() {
  await redirectIfAuthenticated();

  return (
    <main className="auth">
      <Link className="auth__brand" href="/">
        🍳 BlogHost
      </Link>

      <Card className="auth__card">
        <CardContent>
          <h1 className="ui-card__title">Welcome back</h1>
          <p className="auth__intro">Sign in to write, edit and publish recipes.</p>
          <SignInForm />
        </CardContent>
      </Card>

      <p className="auth__footer">
        No food blog yet? <Link href="/sign-up">Start one in 10 minutes</Link>
      </p>
    </main>
  );
}
