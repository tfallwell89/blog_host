import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { RecipeIndex, type RecipeIndexItem } from '@/components/site/recipe-index';
import { getBlogBySubdomain } from '@/lib/blog/queries';
import { formatMinutes } from '@/lib/recipes/format';
import { getPublishedRecipes, type PublicRecipeCard } from '@/lib/recipes/queries';
import { blogPath } from '@/lib/tenant';

interface TenantParams {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: TenantParams): Promise<Metadata> {
  const { subdomain } = await params;
  const blog = await getBlogBySubdomain(subdomain);

  if (!blog) return { title: 'Food blog not found' };

  return {
    title: `${blog.name} — Recipes`,
    description: blog.description,
    alternates: { canonical: blogPath(blog.subdomain) },
  };
}

function toIndexItem(recipe: PublicRecipeCard): RecipeIndexItem {
  const prep = formatMinutes(recipe.prepMinutes);
  const cook = formatMinutes(recipe.cookMinutes);
  const timing = [prep && `Prep ${prep}`, cook && `Cook ${cook}`].filter(Boolean).join(' · ');

  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    imageUrl: recipe.featuredImageUrl,
    eyebrow: recipe.course ?? recipe.cuisine,
    timing: timing || null,
  };
}

export default async function BlogHomePage({ params }: TenantParams) {
  const { subdomain } = await params;
  const blog = await getBlogBySubdomain(subdomain);

  if (!blog) {
    notFound();
  }

  const recipes = await getPublishedRecipes(blog.id);

  if (recipes.length === 0) {
    return (
      <div>
        <h1 className="index__title">Recipes</h1>
        <p className="site-empty">
          {blog.authorName} has not published a recipe yet. Check back soon.
        </p>
      </div>
    );
  }

  return <RecipeIndex recipes={recipes.map(toIndexItem)} subdomain={blog.subdomain} />;
}
