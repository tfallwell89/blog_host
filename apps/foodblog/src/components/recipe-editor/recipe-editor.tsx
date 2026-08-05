'use client';

import { Button, FormField, Input, Select, Textarea, buttonClassName } from '@bloghost/ui';
import type { RecipeStatus } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ChangeEvent } from 'react';

import { type FieldErrors } from '@/lib/form';
import { saveRecipeAction } from '@/lib/recipes/actions';
import { RECIPE_DIFFICULTY_VALUES } from '@/lib/recipes/validation';
import { slugify } from '@/lib/slug';
import { blogRecipePath } from '@/lib/tenant';

import { GroupsEditor } from './groups-editor';
import { toDifficulty, toFormValues, type RecipeEditorState } from './editor-model';

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Not specified' },
  ...RECIPE_DIFFICULTY_VALUES.map((value) => ({
    value,
    label: value === 'HARD' ? 'Challenging' : value === 'MEDIUM' ? 'Medium' : 'Easy',
  })),
];

export interface RecipeEditorProps {
  subdomain: string;
  initialState: RecipeEditorState;
  initialStatus: RecipeStatus;
  recipeId?: string;
  savedNotice?: string;
}

export function RecipeEditor({
  subdomain,
  initialState,
  initialStatus,
  recipeId,
  savedNotice,
}: RecipeEditorProps) {
  const router = useRouter();
  const [state, setState] = useState<RecipeEditorState>(initialState);
  const [status, setStatus] = useState<RecipeStatus>(initialStatus);
  const [slugEdited, setSlugEdited] = useState(recipeId !== undefined);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    savedNotice ? { tone: 'success', text: savedNotice } : null,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  function setField<K extends keyof RecipeEditorState>(key: K, value: RecipeEditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const title = event.target.value;
    setState((current) => ({
      ...current,
      title,
      slug: slugEdited ? current.slug : slugify(title, 80),
    }));
  }

  function save(nextStatus: RecipeStatus) {
    setMessage(null);

    startTransition(async () => {
      const result = await saveRecipeAction(toFormValues(state, nextStatus), recipeId);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors);
        setMessage({ tone: 'error', text: result.message });
        return;
      }

      setFieldErrors(undefined);
      setStatus(nextStatus);

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

  const isPublished = status === 'PUBLISHED';

  return (
    <div className="editor">
      <div className="editor__bar">
        <div>
          <h1 className="page-header__title">{recipeId ? 'Edit recipe' : 'Add a recipe'}</h1>
          <p className="page-header__subtitle">
            {isPublished ? 'Published on your food blog' : 'Draft — not visible to readers yet'}
          </p>
        </div>

        <div className="editor__bar-actions">
          <Link className={buttonClassName({ variant: 'ghost' })} href="/dashboard/recipes">
            Back to recipes
          </Link>

          {isPublished ? (
            <>
              {recipeId ? (
                <Link
                  className={buttonClassName({ variant: 'secondary' })}
                  href={blogRecipePath(subdomain, state.slug)}
                >
                  View
                </Link>
              ) : null}
              <Button variant="secondary" disabled={pending} onClick={() => save('DRAFT')}>
                Unpublish
              </Button>
              <Button disabled={pending} onClick={() => save('PUBLISHED')}>
                {pending ? 'Saving…' : 'Save changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" disabled={pending} onClick={() => save('DRAFT')}>
                {pending ? 'Saving…' : 'Save draft'}
              </Button>
              <Button disabled={pending} onClick={() => save('PUBLISHED')}>
                Publish recipe
              </Button>
            </>
          )}
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

      <div className="editor__grid">
        <div className="editor__main">
          <section className="editor-section">
            <div className="editor-section__head">
              <h2 className="editor-section__title">The basics</h2>
              <p className="editor-section__intro">
                What the dish is called and how you would describe it to a friend.
              </p>
            </div>

            <div className="stack">
              <FormField id="recipe-title" label="Recipe title" error={fieldErrors?.title} required>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    value={state.title}
                    onChange={handleTitleChange}
                    placeholder="Lemon Garlic Butter Chicken"
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>

              <FormField
                id="recipe-slug"
                label="Web address"
                hint={`Readers will find this recipe at /site/${subdomain}/recipes/${state.slug || 'your-recipe'}`}
                error={fieldErrors?.slug}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    value={state.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      setField('slug', event.target.value.toLowerCase());
                    }}
                    placeholder="lemon-garlic-butter-chicken"
                    spellCheck={false}
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>

              <FormField
                id="recipe-description"
                label="Short description"
                hint="Shown in your recipe index and in search results."
                error={fieldErrors?.description}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    rows={2}
                    value={state.description}
                    onChange={(event) => setField('description', event.target.value)}
                    placeholder="Golden chicken thighs in a glossy lemon and garlic pan sauce."
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>

              <FormField
                id="recipe-introduction"
                label="Introduction"
                hint="The story before the recipe. Optional, but readers love it."
                error={fieldErrors?.introduction}
              >
                {({ id, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    rows={6}
                    value={state.introduction}
                    onChange={(event) => setField('introduction', event.target.value)}
                    placeholder="This is the dinner I make when the week has been long…"
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>
            </div>
          </section>

          <GroupsEditor
            groups={state.ingredientGroups}
            onChange={(groups) => setField('ingredientGroups', groups)}
            fieldErrors={fieldErrors}
            errorPrefix="ingredientGroups"
            itemsKey="ingredients"
            labels={{
              heading: 'Ingredients',
              intro:
                'Group ingredients the way a cook would read them, for example “For the chicken” and “For the sauce”.',
              groupTitleLabel: 'Ingredient group',
              groupTitlePlaceholder: 'For the chicken',
              itemLabel: 'Ingredient',
              itemPlaceholder: '8 bone-in, skin-on chicken thighs',
              addGroup: 'Add ingredient group',
              addItem: 'Add ingredient',
              removeGroup: 'Remove group',
              removeItem: 'Remove ingredient',
            }}
          />

          <GroupsEditor
            groups={state.instructionGroups}
            onChange={(groups) => setField('instructionGroups', groups)}
            ordered
            fieldErrors={fieldErrors}
            errorPrefix="instructionGroups"
            itemsKey="steps"
            labels={{
              heading: 'Instructions',
              intro:
                'Break the method into stages, for example “Prepare the chicken” and “Finish the sauce”.',
              groupTitleLabel: 'Instruction group',
              groupTitlePlaceholder: 'Prepare the chicken',
              itemLabel: 'Step',
              itemPlaceholder: 'Pat the chicken thighs completely dry and season all over.',
              addGroup: 'Add instruction group',
              addItem: 'Add step',
              removeGroup: 'Remove group',
              removeItem: 'Remove step',
            }}
          />

          <section className="editor-section">
            <div className="editor-section__head">
              <h2 className="editor-section__title">Notes</h2>
              <p className="editor-section__intro">
                Substitutions, make-ahead advice and the thing that always goes wrong.
              </p>
            </div>
            <FormField id="recipe-notes" label="Recipe notes" error={fieldErrors?.notes}>
              {({ id, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  rows={5}
                  value={state.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                  placeholder="Bone-in thighs give you the best skin, but boneless work too…"
                  aria-describedby={describedBy}
                  invalid={invalid}
                />
              )}
            </FormField>
          </section>
        </div>

        <aside className="editor__aside">
          <section className="editor-section editor-section--card">
            <h2 className="editor-section__title">Recipe details</h2>

            <div className="stack">
              <FormField
                id="recipe-image"
                label="Featured image URL"
                hint="Paste a link to a photo of the finished dish."
                error={fieldErrors?.featuredImageUrl}
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="url"
                    value={state.featuredImageUrl}
                    onChange={(event) => setField('featuredImageUrl', event.target.value)}
                    placeholder="https://images.example.com/chicken.jpg"
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>

              {state.featuredImageUrl ? (
                <img
                  className="editor__image-preview"
                  src={state.featuredImageUrl}
                  alt="Preview of the featured image"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}

              <div className="editor__field-pair">
                <FormField id="recipe-prep" label="Prep (mins)" error={fieldErrors?.prepMinutes}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      inputMode="numeric"
                      value={state.prepMinutes}
                      onChange={(event) => setField('prepMinutes', event.target.value)}
                      placeholder="10"
                      aria-describedby={describedBy}
                      invalid={invalid}
                    />
                  )}
                </FormField>

                <FormField id="recipe-cook" label="Cook (mins)" error={fieldErrors?.cookMinutes}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      inputMode="numeric"
                      value={state.cookMinutes}
                      onChange={(event) => setField('cookMinutes', event.target.value)}
                      placeholder="25"
                      aria-describedby={describedBy}
                      invalid={invalid}
                    />
                  )}
                </FormField>
              </div>

              <div className="editor__field-pair">
                <FormField
                  id="recipe-additional"
                  label="Extra (mins)"
                  hint="Resting, chilling, proving."
                  error={fieldErrors?.additionalMinutes}
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      inputMode="numeric"
                      value={state.additionalMinutes}
                      onChange={(event) => setField('additionalMinutes', event.target.value)}
                      placeholder="0"
                      aria-describedby={describedBy}
                      invalid={invalid}
                    />
                  )}
                </FormField>

                <FormField id="recipe-servings" label="Servings" error={fieldErrors?.servings}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      inputMode="numeric"
                      value={state.servings}
                      onChange={(event) => setField('servings', event.target.value)}
                      placeholder="4"
                      aria-describedby={describedBy}
                      invalid={invalid}
                    />
                  )}
                </FormField>
              </div>

              <FormField id="recipe-course" label="Course" error={fieldErrors?.course}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    value={state.course}
                    onChange={(event) => setField('course', event.target.value)}
                    placeholder="Main course"
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>

              <FormField id="recipe-cuisine" label="Cuisine" error={fieldErrors?.cuisine}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    value={state.cuisine}
                    onChange={(event) => setField('cuisine', event.target.value)}
                    placeholder="Mediterranean"
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>

              <FormField id="recipe-difficulty" label="Difficulty" error={fieldErrors?.difficulty}>
                {({ id, describedBy, invalid }) => (
                  <Select
                    id={id}
                    options={DIFFICULTY_OPTIONS}
                    value={state.difficulty}
                    onChange={(event) => setField('difficulty', toDifficulty(event.target.value))}
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </FormField>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
