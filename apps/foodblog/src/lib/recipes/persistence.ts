import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';

import { GROUP_NAME_MAX, type RecipeInput } from './validation';

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
          create: group.steps.map((step, index) => ({
            text: step.text,
            imageUrl: step.imageUrl,
            position: index,
          })),
        },
      })),
    },
  };
}

function isSlugConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * Turns the group names the editor sent into group ids, creating the ones the
 * blog does not have yet. Names are matched on their slug, so "Weeknight
 * Dinners" joins the existing "Weeknight dinners" rather than sitting beside
 * it; the name the group was created with is the one that is kept.
 */
async function groupIdsFor(
  tx: Prisma.TransactionClient,
  blogId: string,
  names: string[],
): Promise<string[]> {
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name, GROUP_NAME_MAX);
    if (slug !== '' && !bySlug.has(slug)) bySlug.set(slug, name);
  }

  const ids: string[] = [];
  for (const [slug, name] of bySlug) {
    const group = await tx.group.upsert({
      where: { blogId_slug: { blogId, slug } },
      create: { blogId, slug, name },
      update: {},
      select: { id: true },
    });
    ids.push(group.id);
  }

  return ids;
}

/**
 * Groups exist only to hold recipes, so the last recipe leaving one takes it
 * with it. Without this the name would keep being offered in the editor.
 */
async function pruneEmptyGroups(tx: Prisma.TransactionClient, blogId: string): Promise<void> {
  await tx.group.deleteMany({ where: { blogId, recipes: { none: {} } } });
}

export async function createRecipe(blogId: string, input: RecipeInput): Promise<WriteRecipeResult> {
  try {
    const created = await prisma.$transaction(async (tx) => {
      const groupIds = await groupIdsFor(tx, blogId, input.groups);

      return tx.recipe.create({
        data: {
          blogId,
          ...scalarRecipeData(input),
          publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
          ...nestedGroupsData(input),
          groups: { create: groupIds.map((groupId) => ({ groupId })) },
        },
        select: { id: true },
      });
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
 * consistent however the editor reordered them. Group membership is rebuilt
 * the same way, from the names the editor sent.
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
    await prisma.$transaction(async (tx) => {
      const groupIds = await groupIdsFor(tx, blogId, input.groups);

      await tx.ingredientGroup.deleteMany({ where: { recipeId } });
      await tx.instructionGroup.deleteMany({ where: { recipeId } });
      await tx.groupedRecipe.deleteMany({ where: { recipeId } });
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          ...scalarRecipeData(input),
          publishedAt,
          ...nestedGroupsData(input),
          groups: { create: groupIds.map((groupId) => ({ groupId })) },
        },
      });
      await pruneEmptyGroups(tx, blogId);
    });
  } catch (error) {
    if (isSlugConflict(error)) return { ok: false, reason: 'slug-taken' };
    throw error;
  }

  return { ok: true, recipeId };
}

/** Scoped to the blog, so an id from another tenant matches nothing. */
export async function deleteRecipe(blogId: string, recipeId: string): Promise<boolean> {
  const deleted = await prisma.$transaction(async (tx) => {
    const result = await tx.recipe.deleteMany({ where: { id: recipeId, blogId } });
    if (result.count > 0) await pruneEmptyGroups(tx, blogId);
    return result.count;
  });

  return deleted > 0;
}
