import type { Prisma, RecipeStatus } from '@prisma/client';
import { cache } from 'react';

import { prisma } from '@/lib/db';

const recipeDetailInclude = {
  ingredientGroups: {
    orderBy: { position: 'asc' },
    include: { ingredients: { orderBy: { position: 'asc' } } },
  },
  instructionGroups: {
    orderBy: { position: 'asc' },
    include: { steps: { orderBy: { position: 'asc' } } },
  },
} as const;

/** A recipe with its ingredient and instruction trees, ordered by position. */
export type RecipeDetail = Prisma.RecipeGetPayload<{ include: typeof recipeDetailInclude }>;

export interface RecipeListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: RecipeStatus;
  updatedAt: Date;
  publishedAt: Date | null;
}

export async function getRecipesForBlog(
  blogId: string,
  status?: RecipeStatus,
): Promise<RecipeListItem[]> {
  return prisma.recipe.findMany({
    where: { blogId, ...(status ? { status } : {}) },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      updatedAt: true,
      publishedAt: true,
    },
  });
}

export async function getRecentRecipes(blogId: string, take = 5): Promise<RecipeListItem[]> {
  return prisma.recipe.findMany({
    where: { blogId },
    orderBy: { updatedAt: 'desc' },
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      updatedAt: true,
      publishedAt: true,
    },
  });
}

/**
 * Loads a recipe for editing, scoped to a blog the user is a member of. A
 * recipe belonging to somebody else simply comes back as null.
 */
export async function getEditableRecipe(
  recipeId: string,
  userId: string,
): Promise<RecipeDetail | null> {
  return prisma.recipe.findFirst({
    where: { id: recipeId, blog: { members: { some: { userId } } } },
    include: recipeDetailInclude,
  });
}

export interface PublicRecipeCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  featuredImageUrl: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  course: string | null;
  cuisine: string | null;
  publishedAt: Date | null;
}

export const getPublishedRecipes = cache(async (blogId: string): Promise<PublicRecipeCard[]> => {
  return prisma.recipe.findMany({
    where: { blogId, status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      featuredImageUrl: true,
      prepMinutes: true,
      cookMinutes: true,
      course: true,
      cuisine: true,
      publishedAt: true,
    },
  });
});

/** Draft recipes are never returned here — public pages must not leak them. */
export const getPublishedRecipeBySlug = cache(
  async (blogId: string, slug: string): Promise<RecipeDetail | null> => {
    return prisma.recipe.findFirst({
      where: { blogId, slug, status: 'PUBLISHED' },
      include: recipeDetailInclude,
    });
  },
);
