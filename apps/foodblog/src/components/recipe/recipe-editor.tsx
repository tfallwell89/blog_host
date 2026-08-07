'use client';

import { Badge, Button, buttonClassName, cn } from '@bloghost/ui';
import type { RecipeStatus } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { ImageUploadButton } from '@/components/uploads/image-upload-button';
import { brandColorStyle } from '@/lib/blog/brand';
import type { FieldErrors } from '@/lib/form';
import { saveRecipeAction } from '@/lib/recipes/actions';
import { RELATED_RECIPES_PER_GROUP } from '@/lib/recipes/format';
import { slugify } from '@/lib/slug';
import { blogPath, blogRecipePath } from '@/lib/tenant';
import { buildRecipeImagePathname } from '@/lib/uploads/blob-pathname';
import { useMediaQuery } from '@/lib/use-media-query';

import { GroupPanel, type EditorGroup } from './group-panel';
import { groupNameKey, toFormValues, type RecipeDocument } from './recipe-document';
import { RecipePage, type RelatedGroup } from './recipe-page';

/**
 * How the editing surface is arranged. Split view adds a live preview of the
 * published page beside the canvas; it is still the editor, so the canvas
 * keeps every field and the preview stays a preview.
 */
type EditorView = 'full' | 'split';

/**
 * Split view is only offered when both columns can still hold a page column
 * worth reading. Narrower than this the canvas needs the whole width, and the
 * editor is the single canvas it has always been.
 */
const SPLIT_VIEW_QUERY = '(min-width: 80rem)';

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
  /**
   * Every group on the blog. Unlike the document this is server state, so it
   * stays a prop and refreshes with the route after a save.
   */
  groups: EditorGroup[];
  recipeId?: string;
  savedNotice?: string;
}

export function RecipeEditor({
  blog,
  initialRecipe,
  initialStatus,
  initialPublishedAt,
  groups,
  recipeId,
  savedNotice,
}: RecipeEditorProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDocument>(initialRecipe);
  const [status, setStatus] = useState<RecipeStatus>(initialStatus);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt);
  const [previewing, setPreviewing] = useState(false);
  const [view, setView] = useState<EditorView>('split');
  const [slugEdited, setSlugEdited] = useState(recipeId !== undefined);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    savedNotice ? { tone: 'success', text: savedNotice } : null,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  /**
   * A recipe that has never been saved has no id to file images under, so it
   * borrows a draft id. It is created on first upload and kept for the rest of
   * the session, which keeps every image from one sitting together.
   */
  const draftIdRef = useRef<string | null>(null);

  const isPublished = status === 'PUBLISHED';
  const canSplit = useMediaQuery(SPLIT_VIEW_QUERY);

  /*
   * Preview takes the whole width while it is open, and the window can be
   * narrowed past the threshold with split view on. Both fall back to the
   * plain canvas without forgetting the choice, so widening restores it.
   */
  const splitting = view === 'split' && canSplit && !previewing;

  function heroImagePathname(contentType: string): string {
    if (recipeId) {
      return buildRecipeImagePathname({ recipeId, purpose: 'hero', contentType });
    }

    draftIdRef.current ??= crypto.randomUUID();
    return buildRecipeImagePathname({ draftId: draftIdRef.current, purpose: 'hero', contentType });
  }

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

  // What the "More in …" sections will hold once this document is published,
  // derived from the groups it currently names so preview shows the real thing.
  const relatedGroups: RelatedGroup[] = recipe.groups
    .map((name) => groups.find((group) => groupNameKey(group.name) === groupNameKey(name)))
    .filter((group): group is EditorGroup => group !== undefined)
    .map((group) => ({
      name: group.name,
      recipes: group.recipes
        .filter((item) => item.status === 'PUBLISHED' && item.id !== recipeId)
        .slice(0, RELATED_RECIPES_PER_GROUP)
        .map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          imageUrl: item.featuredImageUrl,
          href: blogRecipePath(blog.subdomain, item.slug),
        })),
    }))
    .filter((group) => group.recipes.length > 0);

  const groupsError = fieldErrors
    ? Object.entries(fieldErrors).find(
        ([key]) => key === 'groups' || key.startsWith('groups.'),
      )?.[1]
    : undefined;

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
          {canSplit && !previewing ? (
            <div className="editor__views" role="group" aria-label="Editor layout">
              <button
                className="editor__view"
                type="button"
                aria-pressed={view === 'full'}
                onClick={() => setView('full')}
              >
                Full view
              </button>
              <button
                className="editor__view"
                type="button"
                aria-pressed={view === 'split'}
                onClick={() => setView('split')}
              >
                Split view
              </button>
            </div>
          ) : null}

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

      {/* Preview drops the rail — a reader gets the page column and nothing
          else — and so does split view, where the preview has taken its place. */}
      <div
        className={cn(
          'editor__layout',
          splitting && 'editor__layout--split',
          !previewing && !splitting && 'editor__layout--editing',
        )}
      >
        <div className="editor__edit-column">
          {splitting ? <h2 className="editor__column-title">Recipe editor</h2> : null}

          <div className="editor__canvas site" style={brandColorStyle(blog.brandColor)}>
            <div className="site-container">
              {previewing ? (
                <RecipePage
                  mode="preview"
                  recipe={recipe}
                  byline={byline}
                  indexHref={indexHref}
                  related={relatedGroups}
                />
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
                    photoUpload: (
                      <ImageUploadButton
                        buildPathname={heroImagePathname}
                        onUploaded={(blob) => handleChange('featuredImageUrl', blob.url)}
                        label={recipe.featuredImageUrl ? 'Replace photo' : 'Upload photo'}
                        disabled={pending}
                      />
                    ),
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {splitting ? (
          <aside className="editor__preview" aria-labelledby="live-preview-heading">
            <h2 className="editor__column-title" id="live-preview-heading">
              Live preview
            </h2>

            {/* The scroll lives out here: the page inside is `inert`, and an
                inert box is not something a wheel or a drag can reach. */}
            <div className="editor__preview-scroll">
              {/*
               * The published page, from the same component and stylesheet a
               * reader gets, laid out at the width of this column. It is
               * `inert` so the recipe is in the tab order and the
               * accessibility tree exactly once — on the canvas beside it,
               * whose section headings also win the duplicated ids by coming
               * first — and so a stray click cannot follow a link out of an
               * editor that has no autosave.
               */}
              <div
                className="editor__preview-page site"
                style={brandColorStyle(blog.brandColor)}
                inert
              >
                <div className="site-container">
                  <RecipePage
                    mode="preview"
                    recipe={recipe}
                    byline={byline}
                    indexHref={indexHref}
                    related={relatedGroups}
                  />
                </div>
              </div>
            </div>
          </aside>
        ) : null}

        {previewing || splitting ? null : (
          <GroupPanel
            selected={recipe.groups}
            onChange={(next) => handleChange('groups', next)}
            groups={groups}
            recipeId={recipeId}
            error={groupsError}
          />
        )}
      </div>
    </div>
  );
}
