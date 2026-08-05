import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

import { hashPassword, verifyPassword } from './password';
import type { AuthenticatedUser } from './session';

export type RegisterResult =
  { ok: true; user: AuthenticatedUser } | { ok: false; reason: 'email-taken' };

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<RegisterResult> {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      },
      select: { id: true, email: true, displayName: true },
    });

    return { ok: true, user };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, reason: 'email-taken' };
    }
    throw error;
  }
}

export type AuthenticateResult =
  { ok: true; user: AuthenticatedUser } | { ok: false; reason: 'invalid-credentials' };

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<AuthenticateResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, displayName: true, passwordHash: true },
  });

  if (!user) {
    // Hash anyway so a missing account is not distinguishable by timing.
    await hashPassword(input.password);
    return { ok: false, reason: 'invalid-credentials' };
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return { ok: false, reason: 'invalid-credentials' };

  return {
    ok: true,
    user: { id: user.id, email: user.email, displayName: user.displayName },
  };
}
