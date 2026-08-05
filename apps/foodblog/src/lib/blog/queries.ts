import type { BlogTheme } from '@prisma/client';
import { cache } from 'react';

import { prisma } from '@/lib/db';
import { normalizeSubdomain } from '@/lib/tenant';

const blogSelect = {
  id: true,
  name: true,
  subdomain: true,
  description: true,
  authorName: true,
  theme: true,
  createdAt: true,
} as const;

export type BlogSummary = {
  id: string;
  name: string;
  subdomain: string;
  description: string;
  authorName: string;
  theme: BlogTheme;
  createdAt: Date;
};

/**
 * The blog a user works on. The MVP creates exactly one per account, but the
 * schema allows several so this deliberately returns the oldest membership.
 */
export const getBlogForUser = cache(async (userId: string): Promise<BlogSummary | null> => {
  return prisma.blog.findFirst({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: 'asc' },
    select: blogSelect,
  });
});

export const getBlogBySubdomain = cache(async (subdomain: string): Promise<BlogSummary | null> => {
  return prisma.blog.findUnique({
    where: { subdomain: normalizeSubdomain(subdomain) },
    select: blogSelect,
  });
});

export interface BlogRecipeStats {
  total: number;
  drafts: number;
  published: number;
}

export async function getBlogRecipeStats(blogId: string): Promise<BlogRecipeStats> {
  const grouped = await prisma.recipe.groupBy({
    by: ['status'],
    where: { blogId },
    _count: { _all: true },
  });

  const drafts = grouped.find((row) => row.status === 'DRAFT')?._count._all ?? 0;
  const published = grouped.find((row) => row.status === 'PUBLISHED')?._count._all ?? 0;

  return { total: drafts + published, drafts, published };
}

/** True when the subdomain is free (ignoring the blog being edited). */
export async function isSubdomainAvailable(
  subdomain: string,
  excludeBlogId?: string,
): Promise<boolean> {
  const existing = await prisma.blog.findUnique({
    where: { subdomain: normalizeSubdomain(subdomain) },
    select: { id: true },
  });

  if (!existing) return true;
  return existing.id === excludeBlogId;
}

/** Membership check used by every mutating action. */
export async function userCanEditBlog(userId: string, blogId: string): Promise<boolean> {
  const membership = await prisma.blogMember.findUnique({
    where: { blogId_userId: { blogId, userId } },
    select: { id: true },
  });

  return membership !== null;
}
