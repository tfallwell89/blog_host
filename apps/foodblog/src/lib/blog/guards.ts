import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/guards';
import type { AuthenticatedUser } from '@/lib/auth/session';

import { getBlogForUser, type BlogSummary } from './queries';

export interface BlogContext {
  user: AuthenticatedUser;
  blog: BlogSummary;
}

/**
 * Guarantees a signed-in user who has finished onboarding. Anyone without a
 * blog is sent back to create one.
 */
export async function requireBlog(): Promise<BlogContext> {
  const user = await requireUser();
  const blog = await getBlogForUser(user.id);

  if (!blog) {
    redirect('/onboarding');
  }

  return { user, blog };
}
