import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { toRecipeDocument } from '@/components/recipe/recipe-document';
import { RecipeEditor } from '@/components/recipe/recipe-editor';
import { requireBlog } from '@/lib/blog/guards';
import { getEditableRecipe } from '@/lib/recipes/queries';

// The canvas is the published page, so it needs the public stylesheet too.
import '@/styles/site.css';
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
      blog={{
        subdomain: blog.subdomain,
        authorName: blog.authorName,
        brandColor: blog.brandColor,
      }}
      recipeId={recipe.id}
      initialRecipe={toRecipeDocument(recipe)}
      initialStatus={recipe.status}
      initialPublishedAt={recipe.publishedAt?.toISOString() ?? null}
      savedNotice={saved ? SAVED_NOTICES[saved] : undefined}
    />
  );
}
