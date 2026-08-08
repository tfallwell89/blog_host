import { cn } from '@bloghost/ui';
import Link from 'next/link';
import type { DragEvent, ReactNode } from 'react';

import { PrintButton } from '@/components/site/print-button';
import { Prose } from '@/components/site/prose';
import type { FieldErrors } from '@/lib/form';
import { formatLongDate } from '@/lib/recipes/format';

import {
  CanvasAddButton,
  CanvasControl,
  EditableSelect,
  EditableText,
  focusField,
} from './editable';
import {
  DIFFICULTY_OPTIONS,
  emptyGroup,
  emptyItem,
  insertAt,
  moveBy,
  recipeFacts,
  removeAt,
  toDifficulty,
  updateAt,
  type RecipeDocument,
  type RecipeGroup,
  type RecipeGroupField,
  type RecipeItem,
} from './recipe-document';

/**
 * The recipe page.
 *
 * This is the only description of what a recipe looks like. The editing
 * canvas, the preview and the published page are the same component in
 * different modes, so what a creator edits cannot drift away from what a
 * reader sees. Editing swaps text nodes for inline fields in place; it never
 * swaps in a different layout.
 */
export type RecipeRenderMode = 'edit' | 'preview' | 'published';

export interface RecipeByline {
  authorName: string;
  /** ISO timestamp, or null while the recipe is still a draft. */
  publishedAt: string | null;
}

/**
 * A recipe from one of this recipe's groups, ready to render as a card. The
 * link arrives built so this component needs no tenant helpers, exactly like
 * `indexHref`.
 */
export interface RelatedRecipeCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  href: string;
}

export interface RelatedGroup {
  name: string;
  recipes: RelatedRecipeCard[];
}

export interface RecipeEditContext {
  onChange: <K extends keyof RecipeDocument>(field: K, value: RecipeDocument[K]) => void;
  fieldErrors?: FieldErrors;
  /** Reader-facing prefix of the recipe address, e.g. `/kitchen/recipes/`. */
  slugPrefix: string;
  /**
   * The photo uploader, rendered beside the image field. It arrives as a node
   * rather than being imported here so a published recipe never ships the
   * upload client to readers.
   */
  photoUpload?: ReactNode;
  /**
   * Creates an uploader for one instruction step without adding the Blob
   * client to published recipe bundles.
   */
  stepPhotoUpload?: (options: {
    hasImage: boolean;
    onUploaded: (url: string) => void;
  }) => ReactNode;
  storyPhotoUpload?: (options: {
    hasImage: boolean;
    onUploaded: (url: string) => void;
  }) => ReactNode;
}

interface RecipePageBaseProps {
  recipe: RecipeDocument;
  byline: RecipeByline;
  /** The blog's recipe index, where the reader-facing links point. */
  indexHref: string;
  /** Other recipes in this recipe's groups, one entry per group. */
  related?: RelatedGroup[];
}

export type RecipePageProps = RecipePageBaseProps &
  ({ mode: 'edit'; edit: RecipeEditContext } | { mode: 'preview' | 'published'; edit?: undefined });

export function RecipePage(props: RecipePageProps) {
  const { recipe, byline, indexHref, related } = props;
  // A single narrowing, so every section below reads the same way: `edit` is
  // the editing context when the canvas is live and null when it is not.
  const edit = props.mode === 'edit' ? props.edit : null;

  return (
    <article className={cn('recipe', edit && 'recipe--editing')}>
      {edit ? null : (
        <Link className="recipe__back" href={indexHref}>
          ← All recipes
        </Link>
      )}

      <RecipeHeader recipe={recipe} byline={byline} edit={edit} />
      <RecipeImage recipe={recipe} edit={edit} />
      <RecipeFacts recipe={recipe} edit={edit} />
      <RecipeIntroduction recipe={recipe} edit={edit} />
      <RecipeStory recipe={recipe} edit={edit} />

      {/* The two lists a cook reads together, side by side on a wide screen. */}
      <div className="recipe__content">
        <RecipeGroups
          recipe={recipe}
          edit={edit}
          field="ingredientGroups"
          itemsKey="ingredients"
          heading="Ingredients"
          headingId="ingredients-heading"
          labels={{
            groupTitle: 'Ingredient group name',
            groupTitlePlaceholder: 'For the sauce',
            item: 'Ingredient',
            itemPlaceholder: '200g plain flour',
            addItem: 'Add ingredient',
            addGroup: 'Add ingredient group',
            removeGroup: 'Remove ingredient group',
            removeItem: 'Remove ingredient',
          }}
        />

        <RecipeGroups
          recipe={recipe}
          edit={edit}
          field="instructionGroups"
          itemsKey="steps"
          ordered
          heading="Instructions"
          headingId="instructions-heading"
          labels={{
            groupTitle: 'Instruction group name',
            groupTitlePlaceholder: 'Prepare the chicken',
            item: 'Step',
            itemPlaceholder: 'Pat the chicken thighs completely dry and season all over.',
            addItem: 'Add step',
            addGroup: 'Add instruction group',
            removeGroup: 'Remove instruction group',
            removeItem: 'Remove step',
          }}
        />
      </div>

      <RecipeNotes recipe={recipe} edit={edit} />

      {edit ? null : <RecipeRelated groups={related ?? []} />}

      {edit ? null : (
        <div className="recipe__actions">
          <Link className="site-button recipe__back-button" href={indexHref}>
            Back to all recipes
          </Link>
          <PrintButton />
        </div>
      )}
    </article>
  );
}

interface SectionProps {
  recipe: RecipeDocument;
  edit: RecipeEditContext | null;
}

function RecipeHeader({ recipe, byline, edit }: SectionProps & { byline: RecipeByline }) {
  return (
    <header className="recipe__header">
      <h1 className="recipe__title">
        {edit ? (
          <EditableText
            value={recipe.title}
            onChange={(value) => edit.onChange('title', value)}
            label="Recipe title"
            placeholder="Lemon garlic butter chicken"
            error={edit.fieldErrors?.title}
            singleLine
          />
        ) : (
          recipe.title
        )}
      </h1>

      <p className="recipe__description">
        {edit ? (
          <EditableText
            value={recipe.description}
            onChange={(value) => edit.onChange('description', value)}
            label="Short description"
            placeholder="Golden chicken thighs in a glossy lemon and garlic pan sauce."
            error={edit.fieldErrors?.description}
            minRows={2}
          />
        ) : (
          recipe.description
        )}
      </p>

      <p className="recipe__byline">
        By {byline.authorName}
        {byline.publishedAt ? (
          <>
            {' · '}
            <time dateTime={byline.publishedAt}>{formatLongDate(byline.publishedAt)}</time>
          </>
        ) : null}
      </p>

      {edit ? (
        <p className="recipe__address">
          <span className="recipe__address-prefix">{edit.slugPrefix}</span>
          <EditableText
            className="recipe__address-slug"
            value={recipe.slug}
            onChange={(value) => edit.onChange('slug', value.toLowerCase())}
            label="Web address of this recipe"
            placeholder="lemon-garlic-butter-chicken"
            error={edit.fieldErrors?.slug}
            singleLine
          />
        </p>
      ) : null}
    </header>
  );
}

function RecipeImage({ recipe, edit }: SectionProps) {
  if (!edit) {
    return recipe.featuredImageUrl ? (
      <img
        className="recipe__image"
        src={recipe.featuredImageUrl}
        alt={recipe.title}
        decoding="async"
      />
    ) : null;
  }

  return <RecipePhotoField recipe={recipe} edit={edit} />;
}

/** The photo well: a drop target that doubles as the hero image itself. */
function RecipePhotoField({ recipe, edit }: { recipe: RecipeDocument; edit: RecipeEditContext }) {
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const dropped =
      event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');

    if (dropped.trim()) {
      edit.onChange('featuredImageUrl', dropped.trim());
    }
  }

  return (
    <div className="recipe-photo">
      <div
        className="recipe-photo__well"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {recipe.featuredImageUrl ? (
          <img
            className="recipe__image"
            src={recipe.featuredImageUrl}
            alt={recipe.title}
            decoding="async"
          />
        ) : (
          <div className="recipe-photo__empty">
            <span className="recipe-photo__glyph" aria-hidden="true">
              ◲
            </span>
            <p className="recipe-photo__prompt">Photo of the finished dish</p>
            <p className="recipe-photo__hint">
              {edit.photoUpload
                ? 'Upload a photo below, drop an image link here, or paste one in.'
                : 'Drop an image link here, or paste one below.'}
            </p>
          </div>
        )}
      </div>

      <div className="recipe-photo__link">
        <EditableText
          className="recipe-photo__field"
          value={recipe.featuredImageUrl}
          onChange={(value) => edit.onChange('featuredImageUrl', value)}
          label="Link to the finished dish photo"
          placeholder="https://images.example.com/chicken.jpg"
          error={edit.fieldErrors?.featuredImageUrl}
          singleLine
        />
        {recipe.featuredImageUrl ? (
          <CanvasControl
            label="Remove photo"
            tone="danger"
            onClick={() => edit.onChange('featuredImageUrl', '')}
          >
            ✕
          </CanvasControl>
        ) : null}
      </div>

      {edit.photoUpload}
    </div>
  );
}

function RecipeFacts({ recipe, edit }: SectionProps) {
  const facts = recipeFacts(recipe, edit !== null);
  if (facts.length === 0) return null;

  return (
    <dl className="recipe__facts">
      {facts.map((fact) => (
        <div key={fact.key}>
          <dt className="recipe__fact-label">{fact.label}</dt>
          <dd className="recipe__fact-value">
            {edit === null || fact.kind === 'total' ? (
              (fact.value ?? '—')
            ) : fact.kind === 'difficulty' ? (
              <EditableSelect
                value={recipe.difficulty}
                onChange={(value) => edit.onChange('difficulty', toDifficulty(value))}
                label={fact.label}
                options={DIFFICULTY_OPTIONS}
              />
            ) : (
              <>
                <EditableText
                  className="recipe__fact-input"
                  value={recipe[fact.field]}
                  onChange={(value) => edit.onChange(fact.field, value)}
                  label={fact.label}
                  placeholder={fact.placeholder}
                  error={edit.fieldErrors?.[fact.field]}
                  singleLine
                />
                {fact.kind === 'minutes' ? <span className="recipe__fact-unit">mins</span> : null}
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RecipeIntroduction({ recipe, edit }: SectionProps) {
  if (!edit) {
    return recipe.introduction ? (
      <Prose className="recipe__intro" text={recipe.introduction} />
    ) : null;
  }

  return (
    <div className="recipe__intro">
      <EditableText
        value={recipe.introduction}
        onChange={(value) => edit.onChange('introduction', value)}
        label="Introduction"
        placeholder="This is the dinner I make when the week has been long…"
        error={edit.fieldErrors?.introduction}
        minRows={3}
      />
    </div>
  );
}

function RecipeStory({ recipe, edit }: SectionProps) {
  const hasStory = Boolean(recipe.storyTitle || recipe.storyBody || recipe.storyImageUrl);

  if (!edit) {
    if (!hasStory) return null;

    return (
      <section className="recipe__story">
        {recipe.storyTitle ? (
          <h2 className="recipe__section-title">{recipe.storyTitle}</h2>
        ) : null}
        {recipe.storyBody ? <Prose className="recipe-story__body" text={recipe.storyBody} /> : null}
        {recipe.storyImageUrl ? (
          <img
            className="recipe-story__image"
            src={recipe.storyImageUrl}
            alt={recipe.storyTitle || `More about ${recipe.title}`}
            decoding="async"
            loading="lazy"
          />
        ) : null}
      </section>
    );
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const dropped =
      event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');

    if (dropped.trim()) edit?.onChange('storyImageUrl', dropped.trim());
  }

  return (
    <section className="recipe__story">
      <div className="recipe-story__guidance">
        <p className="recipe-story__guidance-title">Optional: add more context</p>
        <p className="recipe-story__guidance-copy">
          Most recipes are clearest without this section. Use it when a short story, technique, or
          serving idea will genuinely help the reader.
        </p>
      </div>

      <h2 className="recipe__section-title">
        <EditableText
          value={recipe.storyTitle}
          onChange={(value) => edit.onChange('storyTitle', value)}
          label="Section heading"
          placeholder="What makes this recipe special"
          error={edit.fieldErrors?.storyTitle}
          singleLine
        />
      </h2>

      <div className="recipe-story__body">
        <EditableText
          value={recipe.storyBody}
          onChange={(value) => edit.onChange('storyBody', value)}
          label="Section body"
          placeholder="Share the story, technique, or serving idea behind this recipe…"
          error={edit.fieldErrors?.storyBody}
          minRows={4}
        />
      </div>

      <div
        className="recipe-story-photo"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {recipe.storyImageUrl ? (
          <img
            className="recipe-story__image"
            src={recipe.storyImageUrl}
            alt={recipe.storyTitle || `More about ${recipe.title}`}
            decoding="async"
          />
        ) : null}

        <div className="step-photo-editor__actions">
          <EditableText
            className="step-photo-editor__url"
            value={recipe.storyImageUrl}
            onChange={(value) => edit.onChange('storyImageUrl', value)}
            label="Section image URL"
            placeholder="Paste an image URL"
            error={edit.fieldErrors?.storyImageUrl}
            singleLine
          />
          {edit.storyPhotoUpload?.({
            hasImage: Boolean(recipe.storyImageUrl),
            onUploaded: (imageUrl) => edit.onChange('storyImageUrl', imageUrl),
          })}
          {recipe.storyImageUrl ? (
            <CanvasControl
              label="Remove section photo"
              tone="danger"
              onClick={() => edit.onChange('storyImageUrl', '')}
            >
              ✕
            </CanvasControl>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RecipeNotes({ recipe, edit }: SectionProps) {
  if (!edit) {
    return recipe.notes ? (
      <section className="recipe__notes" aria-labelledby="notes-heading">
        <h2 className="recipe__group-title" id="notes-heading">
          Notes
        </h2>
        <Prose text={recipe.notes} />
      </section>
    ) : null;
  }

  return (
    <section className="recipe__notes" aria-labelledby="notes-heading">
      <h2 className="recipe__group-title" id="notes-heading">
        Notes
      </h2>
      <EditableText
        value={recipe.notes}
        onChange={(value) => edit.onChange('notes', value)}
        label="Recipe notes"
        placeholder="Substitutions, make-ahead advice, and the thing that always goes wrong…"
        error={edit.fieldErrors?.notes}
      />
    </section>
  );
}

/**
 * The other recipes in each group this one belongs to. The editing canvas
 * leaves it out: the group panel beside the canvas is already showing the same
 * recipes while the cook decides which groups this one joins.
 */
function RecipeRelated({ groups }: { groups: RelatedGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group, groupIndex) => {
        const headingId = `related-${groupIndex}-heading`;

        return (
          <section className="recipe__related" key={group.name} aria-labelledby={headingId}>
            <h2 className="recipe__section-title" id={headingId}>
              More in {group.name}
            </h2>

            <ul className="recipe-grid">
              {group.recipes.map((item) => (
                <li className="recipe-card" key={item.id}>
                  {item.imageUrl ? (
                    <img
                      className="recipe-card__image"
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="recipe-card__image" />
                  )}
                  <div className="recipe-card__body">
                    <h3 className="recipe-card__title">
                      <Link href={item.href}>{item.title}</Link>
                    </h3>
                    <p className="recipe-card__description">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

interface RecipeGroupsLabels {
  groupTitle: string;
  groupTitlePlaceholder: string;
  item: string;
  itemPlaceholder: string;
  addItem: string;
  addGroup: string;
  removeGroup: string;
  removeItem: string;
}

interface RecipeGroupsProps extends SectionProps {
  field: RecipeGroupField;
  /** Name the server uses for the nested lines, e.g. `ingredients`. */
  itemsKey: 'ingredients' | 'steps';
  heading: string;
  headingId: string;
  labels: RecipeGroupsLabels;
  /** Numbered steps rather than a bulleted list. */
  ordered?: boolean;
}

function StepPhotoField({
  item,
  stepNumber,
  onChange,
  upload,
  error,
}: {
  item: RecipeItem;
  stepNumber: number;
  onChange: (imageUrl: string) => void;
  upload?: ReactNode;
  error?: string;
}) {
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const dropped =
      event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');

    if (dropped.trim()) onChange(dropped.trim());
  }

  return (
    <div
      className={cn('step-photo-editor', item.imageUrl && 'step-photo-editor--has-image')}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      {item.imageUrl ? (
        <img
          className="recipe-step__image"
          src={item.imageUrl}
          alt={`Photo for step ${stepNumber}`}
          decoding="async"
        />
      ) : null}

      <div className="step-photo-editor__actions">
        <EditableText
          className="step-photo-editor__url"
          value={item.imageUrl}
          onChange={onChange}
          label={`Image URL for step ${stepNumber}`}
          placeholder="Paste an image URL"
          error={error}
          singleLine
        />
        {upload}
        {item.imageUrl ? (
          <CanvasControl
            label={`Remove photo from step ${stepNumber}`}
            tone="danger"
            onClick={() => onChange('')}
          >
            ✕
          </CanvasControl>
        ) : null}
      </div>
    </div>
  );
}

function RecipeGroups({
  recipe,
  edit,
  field,
  itemsKey,
  heading,
  headingId,
  labels,
  ordered = false,
}: RecipeGroupsProps) {
  const groups = recipe[field];
  const hasContent = groups.some(
    (group) =>
      group.title.trim() !== '' ||
      group.items.some((item) => item.text.trim() !== '' || item.imageUrl.trim() !== ''),
  );

  function setGroups(next: RecipeGroup[]) {
    edit?.onChange(field, next);
  }

  function updateItem(
    groupIndex: number,
    itemIndex: number,
    updater: (item: RecipeItem) => RecipeItem,
  ) {
    setGroups(
      updateAt(groups, groupIndex, (group) => ({
        ...group,
        items: updateAt(group.items, itemIndex, updater),
      })),
    );
  }

  function itemFieldId(itemKey: string): string {
    return `${field}-${itemKey}`;
  }

  function addItem(groupIndex: number, position: number) {
    const item = emptyItem();
    setGroups(
      updateAt(groups, groupIndex, (group) => ({
        ...group,
        items: insertAt(group.items, position, item),
      })),
    );
    focusField(itemFieldId(item.key));
  }

  function addGroup() {
    const group = emptyGroup();
    const firstLine = group.items[0];

    setGroups([...groups, group]);
    if (firstLine) focusField(itemFieldId(firstLine.key));
  }

  if (!edit && !hasContent) return null;

  return (
    <section aria-labelledby={headingId}>
      <h2 className="recipe__section-title" id={headingId}>
        {heading}
      </h2>

      {edit?.fieldErrors?.[field] ? (
        <p className="editable__error" role="alert">
          {edit.fieldErrors[field]}
        </p>
      ) : null}

      {groups.map((group, groupIndex) => {
        const groupError =
          edit?.fieldErrors?.[`${field}.${groupIndex}.title`] ??
          edit?.fieldErrors?.[`${field}.${groupIndex}.${itemsKey}`];

        const lines = group.items.map((item, itemIndex) => {
          const stepNumber = itemIndex + 1;

          return (
            <li key={item.key}>
              {edit ? (
                <>
                  <div className="recipe-step">
                    <EditableText
                      className="recipe-line"
                      fieldId={itemFieldId(item.key)}
                      value={item.text}
                      onChange={(value) =>
                        updateItem(groupIndex, itemIndex, (current) => ({
                          ...current,
                          text: value,
                        }))
                      }
                      label={`${labels.item} ${itemIndex + 1}`}
                      placeholder={labels.itemPlaceholder}
                      error={
                        edit.fieldErrors?.[
                          `${field}.${groupIndex}.${itemsKey}.${itemIndex}.text`
                        ]
                      }
                      singleLine={!ordered}
                      minRows={ordered ? 2 : 1}
                      onEnter={() => addItem(groupIndex, itemIndex + 1)}
                    />

                    {ordered ? (
                      <StepPhotoField
                        item={item}
                        stepNumber={stepNumber}
                        onChange={(imageUrl) =>
                          updateItem(groupIndex, itemIndex, (current) => ({
                            ...current,
                            imageUrl,
                          }))
                        }
                        upload={edit.stepPhotoUpload?.({
                          hasImage: Boolean(item.imageUrl),
                          onUploaded: (imageUrl) =>
                            updateItem(groupIndex, itemIndex, (current) => ({
                              ...current,
                              imageUrl,
                            })),
                        })}
                        error={
                          edit.fieldErrors?.[
                            `${field}.${groupIndex}.${itemsKey}.${itemIndex}.imageUrl`
                          ]
                        }
                      />
                    ) : null}
                  </div>

                  <span className="canvas-controls">
                    <CanvasControl
                      label={`Move ${labels.item.toLowerCase()} ${itemIndex + 1} up`}
                      disabled={itemIndex === 0}
                      onClick={() =>
                        setGroups(
                          updateAt(groups, groupIndex, (current) => ({
                            ...current,
                            items: moveBy(current.items, itemIndex, -1),
                          })),
                        )
                      }
                    >
                      ↑
                    </CanvasControl>
                    <CanvasControl
                      label={`Move ${labels.item.toLowerCase()} ${itemIndex + 1} down`}
                      disabled={itemIndex === group.items.length - 1}
                      onClick={() =>
                        setGroups(
                          updateAt(groups, groupIndex, (current) => ({
                            ...current,
                            items: moveBy(current.items, itemIndex, 1),
                          })),
                        )
                      }
                    >
                      ↓
                    </CanvasControl>
                    <CanvasControl
                      label={`${labels.removeItem} ${itemIndex + 1}`}
                      tone="danger"
                      disabled={group.items.length === 1}
                      onClick={() =>
                        setGroups(
                          updateAt(groups, groupIndex, (current) => ({
                            ...current,
                            items: removeAt(current.items, itemIndex),
                          })),
                        )
                      }
                    >
                      ✕
                    </CanvasControl>
                  </span>
                </>
              ) : (
                <div className="recipe-step">
                  <span>{item.text}</span>
                  {ordered && item.imageUrl ? (
                    <img
                      className="recipe-step__image"
                      src={item.imageUrl}
                      alt={`Photo for step ${stepNumber}`}
                      decoding="async"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              )}
            </li>
          );
        });

        return (
          <div className="recipe__group" key={group.key}>
            {edit ? (
              <div className="recipe-group__head">
                <h3 className="recipe__group-title">
                  <EditableText
                    value={group.title}
                    onChange={(value) =>
                      setGroups(
                        updateAt(groups, groupIndex, (current) => ({ ...current, title: value })),
                      )
                    }
                    label={`${labels.groupTitle} ${groupIndex + 1}`}
                    placeholder={labels.groupTitlePlaceholder}
                    error={groupError}
                    singleLine
                  />
                </h3>

                <span className="canvas-controls">
                  <CanvasControl
                    label={`Move ${labels.groupTitle.toLowerCase()} ${groupIndex + 1} up`}
                    disabled={groupIndex === 0}
                    onClick={() => setGroups(moveBy(groups, groupIndex, -1))}
                  >
                    ↑
                  </CanvasControl>
                  <CanvasControl
                    label={`Move ${labels.groupTitle.toLowerCase()} ${groupIndex + 1} down`}
                    disabled={groupIndex === groups.length - 1}
                    onClick={() => setGroups(moveBy(groups, groupIndex, 1))}
                  >
                    ↓
                  </CanvasControl>
                  <CanvasControl
                    label={`${labels.removeGroup} ${groupIndex + 1}`}
                    tone="danger"
                    disabled={groups.length === 1}
                    onClick={() => setGroups(removeAt(groups, groupIndex))}
                  >
                    ✕
                  </CanvasControl>
                </span>
              </div>
            ) : group.title ? (
              <h3 className="recipe__group-title">{group.title}</h3>
            ) : null}

            {ordered ? (
              <ol className="step-list">{lines}</ol>
            ) : (
              <ul className="ingredient-list">{lines}</ul>
            )}

            {edit ? (
              <CanvasAddButton
                label={labels.addItem}
                onClick={() => addItem(groupIndex, group.items.length)}
              />
            ) : null}
          </div>
        );
      })}

      {edit ? <CanvasAddButton variant="block" label={labels.addGroup} onClick={addGroup} /> : null}
    </section>
  );
}
