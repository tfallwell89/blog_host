import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

import type { RecipeInput } from './validation';

export type WriteRecipeResult =
  { ok: true; recipeId: string } | { ok: false; reason: 'slug-taken' | 'not-found' };

function scalarRecipeData(input: RecipeInput) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description,
    introduction: input.introduction,
    featuredImageUrl: input.featuredImageUrl,
    prepMinutes: input.prepMinutes,
    cookMinutes: input.cookMinutes,
    additionalMinutes: input.additionalMinutes,
    servings: input.servings,
    cuisine: input.cuisine,
    course: input.course,
    difficulty: input.difficulty,
    notes: input.notes,
    status: input.status,
  };
}

/** Positions come from array order, so reordering in the editor just works. */
function nestedGroupsData(input: RecipeInput) {
  return {
    ingredientGroups: {
      create: input.ingredientGroups.map((group, groupIndex) => ({
        title: group.title,
        position: groupIndex,
        ingredients: {
          create: group.ingredients.map((ingredient, index) => ({
            text: ingredient.text,
            position: index,
          })),
        },
      })),
    },
    instructionGroups: {
      create: input.instructionGroups.map((group, groupIndex) => ({
        title: group.title,
        position: groupIndex,
        steps: {
          create: group.steps.map((step, index) => ({ text: step.text, position: index })),
        },
      })),
    },
  };
}

function isSlugConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function createRecipe(blogId: string, input: RecipeInput): Promise<WriteRecipeResult> {
  try {
    const created = await prisma.recipe.create({
      data: {
        blogId,
        ...scalarRecipeData(input),
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
        ...nestedGroupsData(input),
      },
      select: { id: true },
    });

    return { ok: true, recipeId: created.id };
  } catch (error) {
    if (isSlugConflict(error)) return { ok: false, reason: 'slug-taken' };
    throw error;
  }
}

/**
 * Overwrites a recipe the given blog owns. The ingredient and instruction
 * trees are rebuilt from scratch inside a transaction, which keeps positions
 * consistent however the editor reordered them.
 */
export async function replaceRecipe(
  blogId: string,
  recipeId: string,
  input: RecipeInput,
): Promise<WriteRecipeResult> {
  const existing = await prisma.recipe.findFirst({
    where: { id: recipeId, blogId },
    select: { id: true, publishedAt: true },
  });

  if (!existing) return { ok: false, reason: 'not-found' };

  // Keep the original publication date when re-publishing an existing recipe.
  const publishedAt = input.status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null;

  try {
    await prisma.$transaction([
      prisma.ingredientGroup.deleteMany({ where: { recipeId } }),
      prisma.instructionGroup.deleteMany({ where: { recipeId } }),
      prisma.recipe.update({
        where: { id: recipeId },
        data: { ...scalarRecipeData(input), publishedAt, ...nestedGroupsData(input) },
      }),
    ]);
  } catch (error) {
    if (isSlugConflict(error)) return { ok: false, reason: 'slug-taken' };
    throw error;
  }

  return { ok: true, recipeId };
}

/** Scoped to the blog, so an id from another tenant matches nothing. */
export async function deleteRecipe(blogId: string, recipeId: string): Promise<boolean> {
  const deleted = await prisma.recipe.deleteMany({ where: { id: recipeId, blogId } });
  return deleted.count > 0;
}
