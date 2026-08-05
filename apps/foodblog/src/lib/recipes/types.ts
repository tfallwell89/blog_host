import type { FieldErrors } from '@/lib/form';

import type { RecipeInput } from './validation';

export type SaveRecipeResult =
  | { ok: true; recipeId: string; slug: string; status: RecipeInput['status'] }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export type DeleteRecipeResult = { ok: true } | { ok: false; message: string };
