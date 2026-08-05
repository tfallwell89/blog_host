import type { Metadata } from 'next';

import { emptyRecipeDocument } from '@/components/recipe/recipe-document';
import { RecipeEditor } from '@/components/recipe/recipe-editor';
import { requireBlog } from '@/lib/blog/guards';
import { themeAttribute } from '@/lib/blog/themes';

// The canvas is the published page, so it needs the public stylesheet too.
import '@/styles/site.css';
import '@/styles/editor.css';

export const metadata: Metadata = {
  title: 'Add a recipe',
};

export default async function NewRecipePage() {
  const { blog } = await requireBlog();

  return (
    <RecipeEditor
      blog={{
        subdomain: blog.subdomain,
        authorName: blog.authorName,
        theme: themeAttribute(blog.theme),
      }}
      initialRecipe={emptyRecipeDocument()}
      initialStatus="DRAFT"
      initialPublishedAt={null}
    />
  );
}
