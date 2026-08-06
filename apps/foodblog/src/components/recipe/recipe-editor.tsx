'use client';

import { Badge, Button, buttonClassName } from '@bloghost/ui';
import type { RecipeStatus } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { brandColorStyle } from '@/lib/blog/brand';
import type { FieldErrors } from '@/lib/form';
import { saveRecipeAction } from '@/lib/recipes/actions';
import { slugify } from '@/lib/slug';
import { blogPath, blogRecipePath } from '@/lib/tenant';

import { RecipePage } from './recipe-page';
import { toFormValues, type RecipeDocument } from './recipe-document';

/**
 * The chrome around the recipe canvas: an action bar, save state, and the
 * switch between writing and previewing. Everything that a reader would
 * actually see is rendered by `RecipePage`, in edit or preview mode.
 */
export interface RecipeEditorProps {
  blog: { subdomain: string; authorName: string; brandColor: string };
  initialRecipe: RecipeDocument;
  initialStatus: RecipeStatus;
  /** ISO publication timestamp, shown in the byline. */
  initialPublishedAt: string | null;
  recipeId?: string;
  savedNotice?: string;
}

export function RecipeEditor({
  blog,
  initialRecipe,
  initialStatus,
  initialPublishedAt,
  recipeId,
  savedNotice,
}: RecipeEditorProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDocument>(initialRecipe);
  const [status, setStatus] = useState<RecipeStatus>(initialStatus);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt);
  const [previewing, setPreviewing] = useState(false);
  const [slugEdited, setSlugEdited] = useState(recipeId !== undefined);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    savedNotice ? { tone: 'success', text: savedNotice } : null,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  const isPublished = status === 'PUBLISHED';

  function handleChange<K extends keyof RecipeDocument>(field: K, value: RecipeDocument[K]) {
    if (field === 'slug') setSlugEdited(true);

    setRecipe((current) => {
      const next = { ...current, [field]: value };

      // The address follows the title until the creator takes it over.
      if (field === 'title' && !slugEdited && typeof value === 'string') {
        next.slug = slugify(value, 80);
      }

      return next;
    });
  }

  function save(nextStatus: RecipeStatus) {
    setMessage(null);

    startTransition(async () => {
      const result = await saveRecipeAction(toFormValues(recipe, nextStatus), recipeId);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors);
        setMessage({ tone: 'error', text: result.message });
        setPreviewing(false);
        return;
      }

      setFieldErrors(undefined);
      setStatus(nextStatus);

      if (nextStatus === 'PUBLISHED' && publishedAt === null) {
        setPublishedAt(new Date().toISOString());
      }

      const notice =
        nextStatus === 'PUBLISHED' ? 'published' : recipeId ? 'saved' : 'draft-created';

      if (!recipeId) {
        router.replace(`/dashboard/recipes/${result.recipeId}?saved=${notice}`);
        return;
      }

      setMessage({
        tone: 'success',
        text:
          nextStatus === 'PUBLISHED'
            ? 'Your recipe is live on your food blog.'
            : 'Draft saved. Only you can see it.',
      });
      router.refresh();
    });
  }

  const byline = { authorName: blog.authorName, publishedAt };
  const indexHref = blogPath(blog.subdomain);

  return (
    <div className="editor">
      <div className="editor__bar">
        <div className="editor__bar-context">
          <Link
            className={buttonClassName({ variant: 'ghost', size: 'sm' })}
            href="/dashboard/recipes"
          >
            ← Back to recipes
          </Link>

          <Badge tone={isPublished ? 'success' : 'neutral'}>
            {isPublished ? 'Published' : 'Draft'}
          </Badge>

          {isPublished && recipeId ? (
            <Link className="editor__live-link" href={blogRecipePath(blog.subdomain, recipe.slug)}>
              View live
            </Link>
          ) : null}

          {pending ? (
            <span className="editor__saving" role="status">
              Saving…
            </span>
          ) : null}
        </div>

        <div className="editor__bar-actions">
          <Button variant="ghost" disabled={pending} onClick={() => save('DRAFT')}>
            {isPublished ? 'Unpublish' : 'Save draft'}
          </Button>
          <Button variant="secondary" onClick={() => setPreviewing((current) => !current)}>
            {previewing ? 'Back to editing' : 'Preview'}
          </Button>
          <Button disabled={pending} onClick={() => save('PUBLISHED')}>
            {isPublished ? 'Update recipe' : 'Publish recipe'}
          </Button>
        </div>
      </div>

      {message ? (
        <p
          className={`alert ${message.tone === 'success' ? 'alert--success' : 'alert--error'}`}
          role={message.tone === 'success' ? 'status' : 'alert'}
        >
          {message.text}
        </p>
      ) : null}

      {previewing ? (
        <p className="editor__preview-note">
          This is how readers will see the recipe. Changes are not saved until you publish.
        </p>
      ) : null}

      <div className="editor__canvas site" style={brandColorStyle(blog.brandColor)}>
        <div className="site-container">
          {previewing ? (
            <RecipePage mode="preview" recipe={recipe} byline={byline} indexHref={indexHref} />
          ) : (
            <RecipePage
              mode="edit"
              recipe={recipe}
              byline={byline}
              indexHref={indexHref}
              edit={{
                onChange: handleChange,
                fieldErrors,
                slugPrefix: `${indexHref}/recipes/`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
