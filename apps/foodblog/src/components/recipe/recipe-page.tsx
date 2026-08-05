import { cn } from '@bloghost/ui';
import Link from 'next/link';
import type { DragEvent } from 'react';

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

export interface RecipeEditContext {
  onChange: <K extends keyof RecipeDocument>(field: K, value: RecipeDocument[K]) => void;
  fieldErrors?: FieldErrors;
  /** Reader-facing prefix of the recipe address, e.g. `/site/kitchen/recipes/`. */
  slugPrefix: string;
}

interface RecipePageBaseProps {
  recipe: RecipeDocument;
  byline: RecipeByline;
  /** The blog's recipe index, where the reader-facing links point. */
  indexHref: string;
}

export type RecipePageProps = RecipePageBaseProps &
  ({ mode: 'edit'; edit: RecipeEditContext } | { mode: 'preview' | 'published'; edit?: undefined });

export function RecipePage(props: RecipePageProps) {
  const { recipe, byline, indexHref } = props;
  // A single narrowing, so every section below reads the same way: `edit` is
  // the editing context when the canvas is live and null when it is not.
  const edit = props.mode === 'edit' ? props.edit : null;

  return (
    <article className={cn('recipe', 'site-container--narrow', edit && 'recipe--editing')}>
      {edit ? null : (
        <Link className="recipe__back" href={indexHref}>
          ← All recipes
        </Link>
      )}

      <RecipeHeader recipe={recipe} byline={byline} edit={edit} />
      <RecipeImage recipe={recipe} edit={edit} />
      <RecipeFacts recipe={recipe} edit={edit} />
      <RecipeIntroduction recipe={recipe} edit={edit} />

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

      <RecipeNotes recipe={recipe} edit={edit} />

      {edit ? null : (
        <div className="recipe__actions">
          <Link className="site-button" href={indexHref}>
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
            <p className="recipe-photo__hint">Drop an image link here, or paste one below.</p>
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
      />
    </div>
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

  function setGroups(next: RecipeGroup[]) {
    edit?.onChange(field, next);
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

        const lines = group.items.map((item, itemIndex) => (
          <li key={item.key}>
            {edit ? (
              <>
                <EditableText
                  className="recipe-line"
                  fieldId={itemFieldId(item.key)}
                  value={item.text}
                  onChange={(value) =>
                    setGroups(
                      updateAt(groups, groupIndex, (current) => ({
                        ...current,
                        items: updateAt(current.items, itemIndex, (currentItem) => ({
                          ...currentItem,
                          text: value,
                        })),
                      })),
                    )
                  }
                  label={`${labels.item} ${itemIndex + 1}`}
                  placeholder={labels.itemPlaceholder}
                  error={edit.fieldErrors?.[`${field}.${groupIndex}.${itemsKey}.${itemIndex}.text`]}
                  singleLine={!ordered}
                  onEnter={() => addItem(groupIndex, itemIndex + 1)}
                />

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
              item.text
            )}
          </li>
        ));

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
