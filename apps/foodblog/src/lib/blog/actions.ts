'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db';
import { errorState, formErrorState, readString, successState, type FormState } from '@/lib/form';
import { blogPath } from '@/lib/tenant';

import { requireBlog } from './guards';
import { getBlogForUser, isSubdomainAvailable } from './queries';
import { createBlogSchema, updateBlogSettingsSchema, updateThemeSchema } from './validation';

const SUBDOMAIN_TAKEN = 'That address is already taken. Try another one.';

export async function createBlogAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  // One blog per account in the MVP; send returning users to their dashboard.
  const existing = await getBlogForUser(user.id);
  if (existing) {
    redirect('/dashboard');
  }

  const parsed = createBlogSchema.safeParse({
    name: readString(formData, 'name'),
    subdomain: readString(formData, 'subdomain'),
    description: readString(formData, 'description'),
    theme: readString(formData, 'theme'),
  });

  if (!parsed.success) {
    return formErrorState(parsed.error, 'Please fix the highlighted fields.');
  }

  const { name, subdomain, description, theme } = parsed.data;

  if (!(await isSubdomainAvailable(subdomain))) {
    return errorState(SUBDOMAIN_TAKEN, { subdomain: SUBDOMAIN_TAKEN });
  }

  try {
    await prisma.blog.create({
      data: {
        name,
        subdomain,
        description,
        theme,
        authorName: user.displayName,
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return errorState(SUBDOMAIN_TAKEN, { subdomain: SUBDOMAIN_TAKEN });
    }
    throw error;
  }

  redirect('/dashboard');
}

export async function updateBlogSettingsAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { blog } = await requireBlog();

  const parsed = updateBlogSettingsSchema.safeParse({
    name: readString(formData, 'name'),
    subdomain: readString(formData, 'subdomain'),
    description: readString(formData, 'description'),
    theme: readString(formData, 'theme'),
    authorName: readString(formData, 'authorName'),
  });

  if (!parsed.success) {
    return formErrorState(parsed.error, 'Please fix the highlighted fields.');
  }

  const previousSubdomain = blog.subdomain;

  if (!(await isSubdomainAvailable(parsed.data.subdomain, blog.id))) {
    return errorState(SUBDOMAIN_TAKEN, { subdomain: SUBDOMAIN_TAKEN });
  }

  try {
    await prisma.blog.update({ where: { id: blog.id }, data: parsed.data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return errorState(SUBDOMAIN_TAKEN, { subdomain: SUBDOMAIN_TAKEN });
    }
    throw error;
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath(blogPath(previousSubdomain), 'layout');
  revalidatePath(blogPath(parsed.data.subdomain), 'layout');

  return successState('Your food blog settings are saved.');
}

export async function updateThemeAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { blog } = await requireBlog();

  const parsed = updateThemeSchema.safeParse({ theme: readString(formData, 'theme') });
  if (!parsed.success) {
    return formErrorState(parsed.error, 'Pick one of the available themes.');
  }

  await prisma.blog.update({ where: { id: blog.id }, data: { theme: parsed.data.theme } });

  revalidatePath('/dashboard/appearance');
  revalidatePath(blogPath(blog.subdomain), 'layout');

  return successState('Theme updated. Your food blog has a new look.');
}
