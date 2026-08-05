import { Card, CardContent, EmptyState, buttonClassName } from '@bloghost/ui';
import type { RecipeStatus } from '@prisma/client';
import type { Metadata } from 'next';
import Link from 'next/link';

import { DeleteRecipeButton } from '@/components/dashboard/delete-recipe-button';
import { RecipeRow } from '@/components/dashboard/recipe-row';
import { requireBlog } from '@/lib/blog/guards';
import { getRecipesForBlog } from '@/lib/recipes/queries';
import { blogRecipePath } from '@/lib/tenant';

export const metadata: Metadata = {
  title: 'Recipes',
};

const FILTERS = [
  { key: 'all', label: 'All recipes', status: undefined },
  { key: 'published', label: 'Published', status: 'PUBLISHED' as RecipeStatus },
  { key: 'draft', label: 'Drafts', status: 'DRAFT' as RecipeStatus },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

function parseFilter(value: string | undefined): FilterKey {
  return FILTERS.some((filter) => filter.key === value) ? (value as FilterKey) : 'all';
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { blog } = await requireBlog();
  const { status } = await searchParams;

  const activeFilter = parseFilter(status);
  const filter = FILTERS.find((entry) => entry.key === activeFilter) ?? FILTERS[0];
  const recipes = await getRecipesForBlog(blog.id, filter.status);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Recipes</h1>
          <p className="page-header__subtitle">
            Everything you have written for {blog.name}, drafts included.
          </p>
        </div>
        <div className="page-header__actions">
          <Link className={buttonClassName()} href="/dashboard/recipes/new">
            Add a recipe
          </Link>
        </div>
      </div>

      <nav className="filter-bar" aria-label="Filter recipes">
        {FILTERS.map((entry) => (
          <Link
            key={entry.key}
            className="filter-bar__link"
            href={
              entry.key === 'all' ? '/dashboard/recipes' : `/dashboard/recipes?status=${entry.key}`
            }
            aria-current={entry.key === activeFilter ? 'page' : undefined}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      <Card>
        {recipes.length === 0 ? (
          <CardContent>
            {activeFilter === 'all' ? (
              <EmptyState
                icon="🍲"
                title="No recipes yet"
                description="Start with something you have cooked recently — the editor walks you through ingredients, steps and timings."
                action={
                  <Link className={buttonClassName()} href="/dashboard/recipes/new">
                    Add your first recipe
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon="🔍"
                title={`No ${activeFilter} recipes`}
                description={
                  activeFilter === 'draft'
                    ? 'Every recipe you have written is published. Nice work.'
                    : 'Nothing published yet. Open a draft and hit publish when it is ready.'
                }
                action={
                  <Link
                    className={buttonClassName({ variant: 'secondary' })}
                    href="/dashboard/recipes"
                  >
                    Show all recipes
                  </Link>
                }
              />
            )}
          </CardContent>
        ) : (
          <div className="recipe-list">
            {recipes.map((recipe) => (
              <RecipeRow
                key={recipe.id}
                recipe={recipe}
                actions={
                  <>
                    <Link
                      className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                      href={`/dashboard/recipes/${recipe.id}`}
                    >
                      Edit
                    </Link>
                    {recipe.status === 'PUBLISHED' ? (
                      <Link
                        className={buttonClassName({ variant: 'ghost', size: 'sm' })}
                        href={blogRecipePath(blog.subdomain, recipe.slug)}
                      >
                        View
                      </Link>
                    ) : null}
                    <DeleteRecipeButton recipeId={recipe.id} recipeTitle={recipe.title} />
                  </>
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
