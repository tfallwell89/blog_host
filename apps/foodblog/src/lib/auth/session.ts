import { createHash, randomBytes } from 'node:crypto';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { prisma } from '@/lib/db';

export const SESSION_COOKIE_NAME = 'bloghost_session';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
}

export interface ActiveSession {
  id: string;
  expiresAt: Date;
  user: AuthenticatedUser;
}

/** Sessions are looked up by hash so a database leak cannot be replayed. */
function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * Resolves the signed-in user for the current request. Wrapped in `cache` so
 * repeated calls within one render hit the database once.
 */
export const getCurrentSession = cache(async (): Promise<ActiveSession | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, displayName: true } },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session;
});

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/** Clears the session row and the cookie. Safe to call when signed out. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
