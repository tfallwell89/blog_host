'use server';

import { revalidatePath } from 'next/cache';

import { requireBlog } from '@/lib/blog/guards';
import { toFieldErrors } from '@/lib/form';
import { blogPath } from '@/lib/tenant';

import { createRecipe, deleteRecipe, replaceRecipe } from './persistence';
import type { DeleteRecipeResult, SaveRecipeResult } from './types';
import { recipeInputSchema, type RecipeFormValues } from './validation';

const SLUG_TAKEN = 'You already have a recipe at that address. Try a different one.';
const NOT_FOUND = 'That recipe could not be found on your food blog.';

function revalidateRecipePaths(subdomain: string): void {
  revalidatePath('/dashboard', 'layout');
  revalidatePath(blogPath(subdomain), 'layout');
}

/**
 * Creates a recipe, or replaces one the signed-in user owns. The whole recipe
 * document arrives from the editor and is validated here before it is written.
 */
export async function saveRecipeAction(
  values: RecipeFormValues,
  recipeId?: string,
): Promise<SaveRecipeResult> {
  const { blog } = await requireBlog();

  const parsed = recipeInputSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields before saving.',
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const result = recipeId
    ? await replaceRecipe(blog.id, recipeId, input)
    : await createRecipe(blog.id, input);

  if (!result.ok) {
    return result.reason === 'slug-taken'
      ? { ok: false, message: SLUG_TAKEN, fieldErrors: { slug: SLUG_TAKEN } }
      : { ok: false, message: NOT_FOUND };
  }

  revalidateRecipePaths(blog.subdomain);
  return { ok: true, recipeId: result.recipeId, slug: input.slug, status: input.status };
}

export async function deleteRecipeAction(recipeId: string): Promise<DeleteRecipeResult> {
  const { blog } = await requireBlog();

  const deleted = await deleteRecipe(blog.id, recipeId);
  if (!deleted) {
    return { ok: false, message: NOT_FOUND };
  }

  revalidateRecipePaths(blog.subdomain);
  return { ok: true };
}
