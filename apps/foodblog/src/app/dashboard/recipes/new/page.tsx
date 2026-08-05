import type { Metadata } from 'next';

import { emptyRecipeState } from '@/components/recipe-editor/editor-model';
import { RecipeEditor } from '@/components/recipe-editor/recipe-editor';
import { requireBlog } from '@/lib/blog/guards';

import '@/styles/editor.css';

export const metadata: Metadata = {
  title: 'Add a recipe',
};

export default async function NewRecipePage() {
  const { blog } = await requireBlog();

  return (
    <RecipeEditor
      subdomain={blog.subdomain}
      initialState={emptyRecipeState()}
      initialStatus="DRAFT"
    />
  );
}
