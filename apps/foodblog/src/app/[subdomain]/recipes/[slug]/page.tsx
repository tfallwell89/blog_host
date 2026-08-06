import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { toRecipeDocument } from '@/components/recipe/recipe-document';
import { RecipePage } from '@/components/recipe/recipe-page';
import { getBlogBySubdomain } from '@/lib/blog/queries';
import { buildRecipeJsonLd } from '@/lib/recipes/json-ld';
import { getPublishedRecipeBySlug, getRelatedPublishedRecipes } from '@/lib/recipes/queries';
import { blogPath, blogRecipePath, blogRecipeUrl } from '@/lib/tenant';

interface RecipeParams {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: RecipeParams): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const blog = await getBlogBySubdomain(subdomain);
  if (!blog) return { title: 'Recipe not found' };

  const recipe = await getPublishedRecipeBySlug(blog.id, slug);
  if (!recipe) return { title: 'Recipe not found' };

  const canonical = blogRecipePath(blog.subdomain, recipe.slug);

  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: recipe.title,
      description: recipe.description,
      url: canonical,
      siteName: blog.name,
      publishedTime: recipe.publishedAt?.toISOString(),
      modifiedTime: recipe.updatedAt.toISOString(),
      images: recipe.featuredImageUrl ? [recipe.featuredImageUrl] : undefined,
    },
  };
}

export default async function PublicRecipePage({ params }: RecipeParams) {
  const { subdomain, slug } = await params;

  const blog = await getBlogBySubdomain(subdomain);
  if (!blog) {
    notFound();
  }

  // Only published recipes are queried, so drafts stay private.
  const recipe = await getPublishedRecipeBySlug(blog.id, slug);
  if (!recipe) {
    notFound();
  }

  // The other published recipes in this recipe's groups, one entry per group.
  const related = await getRelatedPublishedRecipes(blog.id, recipe.id);

  const jsonLd = buildRecipeJsonLd({
    recipe,
    authorName: blog.authorName,
    blogName: blog.name,
    url: blogRecipeUrl(blog.subdomain, recipe.slug),
  });

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data has to be serialised into the document for crawlers.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* The same component the creator edits on, in its reading mode. */}
      <RecipePage
        mode="published"
        recipe={toRecipeDocument(recipe)}
        byline={{
          authorName: blog.authorName,
          publishedAt: recipe.publishedAt?.toISOString() ?? null,
        }}
        indexHref={blogPath(blog.subdomain)}
        related={related.map((group) => ({
          name: group.name,
          recipes: group.recipes.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            imageUrl: item.featuredImageUrl,
            href: blogRecipePath(blog.subdomain, item.slug),
          })),
        }))}
      />
    </>
  );
}
