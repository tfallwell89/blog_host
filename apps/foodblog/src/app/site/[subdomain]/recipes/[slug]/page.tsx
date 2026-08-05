import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PrintButton } from '@/components/site/print-button';
import { Prose } from '@/components/site/prose';
import { getBlogBySubdomain } from '@/lib/blog/queries';
import { DIFFICULTY_LABELS, formatMinutes, totalMinutes } from '@/lib/recipes/format';
import { buildRecipeJsonLd } from '@/lib/recipes/json-ld';
import { getPublishedRecipeBySlug } from '@/lib/recipes/queries';
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

  const total = totalMinutes(recipe);
  const facts = [
    { label: 'Prep', value: formatMinutes(recipe.prepMinutes) },
    { label: 'Cook', value: formatMinutes(recipe.cookMinutes) },
    { label: 'Extra', value: formatMinutes(recipe.additionalMinutes) },
    { label: 'Total', value: formatMinutes(total) },
    { label: 'Serves', value: recipe.servings ? String(recipe.servings) : null },
    { label: 'Course', value: recipe.course },
    { label: 'Cuisine', value: recipe.cuisine },
    { label: 'Difficulty', value: recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] : null },
  ].filter((fact): fact is { label: string; value: string } => fact.value !== null);

  const jsonLd = buildRecipeJsonLd({
    recipe,
    authorName: blog.authorName,
    blogName: blog.name,
    url: blogRecipeUrl(blog.subdomain, recipe.slug),
  });

  const indexHref = blogPath(blog.subdomain);

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data has to be serialised into the document for crawlers.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="recipe site-container--narrow">
        <Link className="recipe__back" href={indexHref}>
          ← All recipes
        </Link>

        <header className="recipe__header">
          <h1 className="recipe__title">{recipe.title}</h1>
          <p className="recipe__description">{recipe.description}</p>
          <p className="recipe__byline">
            By {blog.authorName}
            {recipe.publishedAt ? (
              <>
                {' · '}
                <time dateTime={recipe.publishedAt.toISOString()}>
                  {recipe.publishedAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
              </>
            ) : null}
          </p>
        </header>

        {recipe.featuredImageUrl ? (
          <img
            className="recipe__image"
            src={recipe.featuredImageUrl}
            alt={recipe.title}
            decoding="async"
          />
        ) : null}

        {facts.length > 0 ? (
          <dl className="recipe__facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="recipe__fact-label">{fact.label}</dt>
                <dd className="recipe__fact-value">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {recipe.introduction ? (
          <Prose className="recipe__intro" text={recipe.introduction} />
        ) : null}

        <section aria-labelledby="ingredients-heading">
          <h2 className="recipe__section-title" id="ingredients-heading">
            Ingredients
          </h2>
          {recipe.ingredientGroups.map((group) => (
            <div className="recipe__group" key={group.id}>
              {group.title ? <h3 className="recipe__group-title">{group.title}</h3> : null}
              <ul className="ingredient-list">
                {group.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>{ingredient.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="instructions-heading">
          <h2 className="recipe__section-title" id="instructions-heading">
            Instructions
          </h2>
          {recipe.instructionGroups.map((group) => (
            <div className="recipe__group" key={group.id}>
              {group.title ? <h3 className="recipe__group-title">{group.title}</h3> : null}
              <ol className="step-list">
                {group.steps.map((step) => (
                  <li key={step.id}>{step.text}</li>
                ))}
              </ol>
            </div>
          ))}
        </section>

        {recipe.notes ? (
          <section className="recipe__notes" aria-labelledby="notes-heading">
            <h2 className="recipe__group-title" id="notes-heading">
              Notes
            </h2>
            <Prose text={recipe.notes} />
          </section>
        ) : null}

        <div className="recipe__actions">
          <Link className="site-button" href={indexHref}>
            Back to all recipes
          </Link>
          <PrintButton />
        </div>
      </article>
    </>
  );
}
