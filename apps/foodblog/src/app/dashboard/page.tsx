import { Card, CardContent, CardHeader, EmptyState, buttonClassName } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { RecipeRow } from '@/components/dashboard/recipe-row';
import { requireBlog } from '@/lib/blog/guards';
import { getBlogRecipeStats } from '@/lib/blog/queries';
import { getRecentRecipes } from '@/lib/recipes/queries';
import { blogPath, blogUrl } from '@/lib/tenant';

export const metadata: Metadata = {
  title: 'Overview',
};

export default async function DashboardOverviewPage() {
  const { blog } = await requireBlog();
  const [stats, recentRecipes] = await Promise.all([
    getBlogRecipeStats(blog.id),
    getRecentRecipes(blog.id),
  ]);

  const publicPath = blogPath(blog.subdomain);

  return (
    <div className="stack stack--lg">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">{blog.name}</h1>
          <p className="page-header__subtitle">{blog.description}</p>
        </div>
        <div className="page-header__actions">
          <Link className={buttonClassName()} href="/dashboard/recipes/new">
            Add a recipe
          </Link>
          <Link
            className={buttonClassName({
              variant: 'secondary',
              className: 'dashboard-view-blog',
            })}
            href={publicPath}
          >
            View your food blog
          </Link>
        </div>
      </div>

      <Card>
        <CardContent>
          <p className="blog-url">
            <span className="muted">Your food blog is live at</span>
            <code className="blog-url__value">{blogUrl(blog.subdomain)}</code>
            <Link href={publicPath}>Open</Link>
          </p>
        </CardContent>
      </Card>

      <section aria-label="Recipe counts">
        <div className="stat-grid">
          <Link className="stat" href="/dashboard/recipes">
            <p className="stat__label">Recipes</p>
            <p className="stat__value">{stats.total}</p>
          </Link>
          <Link className="stat" href="/dashboard/recipes?status=published">
            <p className="stat__label">Published</p>
            <p className="stat__value">{stats.published}</p>
          </Link>
          <Link className="stat" href="/dashboard/recipes?status=draft">
            <p className="stat__label">Drafts</p>
            <p className="stat__value">{stats.drafts}</p>
          </Link>
        </div>
      </section>

      <Card>
        <CardHeader
          title="Recent recipes"
          description="The recipes you touched most recently."
          action={
            <Link
              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
              href="/dashboard/recipes"
            >
              All recipes
            </Link>
          }
        />
        {recentRecipes.length === 0 ? (
          <CardContent>
            <EmptyState
              icon="🥣"
              title="No recipes yet"
              description="Your food blog is ready and waiting. Add the first recipe you would cook for a friend."
              action={
                <Link className={buttonClassName()} href="/dashboard/recipes/new">
                  Add a recipe
                </Link>
              }
            />
          </CardContent>
        ) : (
          <div className="recipe-list">
            {recentRecipes.map((recipe) => (
              <RecipeRow
                key={recipe.id}
                recipe={recipe}
                actions={
                  <Link
                    className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                    href={`/dashboard/recipes/${recipe.id}`}
                  >
                    <span aria-hidden="true">✎</span>
                    Edit
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
