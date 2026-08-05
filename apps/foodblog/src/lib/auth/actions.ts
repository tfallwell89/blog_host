'use server';

import { redirect } from 'next/navigation';

import { errorState, formErrorState, readString, type FormState } from '@/lib/form';

import { authenticateUser, registerUser } from './service';
import { createSession, destroySession } from './session';
import { signInSchema, signUpSchema } from './validation';

export async function signUpAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    displayName: readString(formData, 'displayName'),
    email: readString(formData, 'email'),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.success) {
    return formErrorState(parsed.error, 'Please fix the highlighted fields.');
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return errorState('That email address is already registered.', {
      email: 'An account with this email already exists. Try signing in instead.',
    });
  }

  await createSession(result.user.id);
  redirect('/onboarding');
}

export async function signInAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: readString(formData, 'email'),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.success) {
    return formErrorState(parsed.error, 'Please fix the highlighted fields.');
  }

  const result = await authenticateUser(parsed.data);
  if (!result.ok) {
    return errorState('That email and password combination did not match an account.');
  }

  await createSession(result.user.id);
  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}
