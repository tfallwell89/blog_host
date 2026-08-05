import { redirect } from 'next/navigation';

import { getCurrentUser, type AuthenticatedUser } from './session';

/** Use at the top of any server component or action behind the dashboard. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }
  return user;
}

/** Keeps signed-in visitors away from the sign-in and sign-up screens. */
export async function redirectIfAuthenticated(destination = '/dashboard'): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    redirect(destination);
  }
}
