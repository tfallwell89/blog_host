import type { Prisma, RecipeStatus } from '@prisma/client';
import { cache } from 'react';

import { prisma } from '@/lib/db';
import { RELATED_RECIPES_PER_GROUP } from '@/lib/recipes/format';

const recipeDetailInclude = {
  ingredientGroups: {
    orderBy: { position: 'asc' },
    include: { ingredients: { orderBy: { position: 'asc' } } },
  },
  instructionGroups: {
    orderBy: { position: 'asc' },
    include: { steps: { orderBy: { position: 'asc' } } },
  },
  groups: {
    orderBy: { group: { name: 'asc' } },
    select: { group: { select: { name: true } } },
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

/* Groups ------------------------------------------------------------------ */

/** A recipe as the editor's group panel lists it, drafts included. */
export interface GroupRecipeItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  featuredImageUrl: string | null;
  status: RecipeStatus;
}

export interface BlogGroup {
  id: string;
  name: string;
  slug: string;
  recipes: GroupRecipeItem[];
}

/**
 * Every group on the blog with the recipes already in it. The editor needs the
 * whole set: it offers the names as suggestions and shows what a group holds
 * before the cook commits to joining it.
 */
export async function getGroupsForBlog(blogId: string): Promise<BlogGroup[]> {
  const groups = await prisma.group.findMany({
    where: { blogId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      recipes: {
        orderBy: { recipe: { updatedAt: 'desc' } },
        select: {
          recipe: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              featuredImageUrl: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    recipes: group.recipes.map((entry) => entry.recipe),
  }));
}

export interface RelatedRecipeItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  featuredImageUrl: string | null;
}

/** One group's worth of "More in …" cards on a published recipe page. */
export interface RelatedRecipeGroup {
  name: string;
  recipes: RelatedRecipeItem[];
}

/**
 * The other published recipes in each group this recipe belongs to. Drafts and
 * the recipe itself are excluded in the query, and a group with nothing left to
 * show is dropped so the page renders no empty section.
 */
export const getRelatedPublishedRecipes = cache(
  async (blogId: string, recipeId: string): Promise<RelatedRecipeGroup[]> => {
    const groups = await prisma.group.findMany({
      where: { blogId, recipes: { some: { recipeId } } },
      orderBy: { name: 'asc' },
      select: {
        name: true,
        recipes: {
          where: { recipe: { status: 'PUBLISHED', id: { not: recipeId } } },
          orderBy: { recipe: { publishedAt: 'desc' } },
          take: RELATED_RECIPES_PER_GROUP,
          select: {
            recipe: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                featuredImageUrl: true,
              },
            },
          },
        },
      },
    });

    return groups
      .map((group) => ({ name: group.name, recipes: group.recipes.map((entry) => entry.recipe) }))
      .filter((group) => group.recipes.length > 0);
  },
);
