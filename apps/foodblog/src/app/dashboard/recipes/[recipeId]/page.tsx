import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { toEditorState } from '@/components/recipe-editor/editor-model';
import { RecipeEditor } from '@/components/recipe-editor/recipe-editor';
import { requireBlog } from '@/lib/blog/guards';
import { getEditableRecipe } from '@/lib/recipes/queries';

import '@/styles/editor.css';

export const metadata: Metadata = {
  title: 'Edit recipe',
};

const SAVED_NOTICES: Record<string, string> = {
  published: 'Your recipe is live on your food blog.',
  saved: 'Recipe saved.',
  'draft-created': 'Draft saved. Only you can see it until you publish.',
};

export default async function EditRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { user, blog } = await requireBlog();
  const { recipeId } = await params;
  const { saved } = await searchParams;

  // Scoped to the signed-in user's blogs, so another tenant's id simply 404s.
  const recipe = await getEditableRecipe(recipeId, user.id);
  if (!recipe) {
    notFound();
  }

  return (
    <RecipeEditor
      subdomain={blog.subdomain}
      recipeId={recipe.id}
      initialState={toEditorState(recipe)}
      initialStatus={recipe.status}
      savedNotice={saved ? SAVED_NOTICES[saved] : undefined}
    />
  );
}
