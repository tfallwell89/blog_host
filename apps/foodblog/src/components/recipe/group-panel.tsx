'use client';

import { Badge, Button, FormField, Input } from '@bloghost/ui';
import type { RecipeStatus } from '@prisma/client';
import Link from 'next/link';
import { useId, useState } from 'react';

import { GROUP_NAME_MAX, MAX_GROUPS_PER_RECIPE } from '@/lib/recipes/validation';

import { groupNameKey, withGroupName, withoutGroupName } from './recipe-document';

/**
 * The column beside the canvas, where a cook groups this recipe with others.
 *
 * A group is just a name: typing one that does not exist creates it on save,
 * and typing one that does joins it. The recipes already in each group are
 * listed underneath so the cook can see what the group holds — the same set a
 * reader gets in the "More in …" section of the published page.
 *
 * The row shapes are declared here rather than imported from the query layer,
 * so nothing pulls Prisma into the browser bundle. `RecipeEditor` reads the
 * same rows to build the related cards preview mode shows.
 */
export interface EditorGroupRecipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  featuredImageUrl: string | null;
  status: RecipeStatus;
}

export interface EditorGroup {
  id: string;
  name: string;
  recipes: EditorGroupRecipe[];
}

export interface GroupPanelProps {
  /** Names of the groups the recipe being edited belongs to. */
  selected: string[];
  onChange: (groups: string[]) => void;
  /** Every group on the blog, with the recipes already in each one. */
  groups: EditorGroup[];
  /** The recipe being edited, left out of its own related list. */
  recipeId?: string;
  error?: string;
}

const MAX_SUGGESTIONS = 6;

export function GroupPanel({ selected, onChange, groups, recipeId, error }: GroupPanelProps) {
  const [draft, setDraft] = useState('');
  const fieldId = useId();
  const listId = `${fieldId}-names`;

  const selectedKeys = new Set(selected.map(groupNameKey));
  const full = selected.length >= MAX_GROUPS_PER_RECIPE;

  function add(name: string) {
    // Joining an existing group keeps that group's spelling, so "weeknight
    // dinners" does not appear beside "Weeknight dinners" in the panel.
    const existing = groups.find((group) => groupNameKey(group.name) === groupNameKey(name));
    onChange(withGroupName(selected, existing ? existing.name : name));
    setDraft('');
  }

  const suggestions = groups
    .filter((group) => !selectedKeys.has(groupNameKey(group.name)))
    .slice(0, MAX_SUGGESTIONS);

  return (
    <aside className="editor__rail" aria-labelledby="groups-heading">
      <h2 className="editor__rail-title" id="groups-heading">
        Groups
      </h2>
      <p className="editor__rail-hint">
        Group this recipe with others and readers will find them at the end of the page.
      </p>

      {selected.length > 0 ? (
        <ul className="group-chips">
          {selected.map((name) => (
            <li key={groupNameKey(name)}>
              <span className="group-chip">
                {name}
                <button
                  className="group-chip__remove"
                  type="button"
                  title={`Remove from ${name}`}
                  aria-label={`Remove from ${name}`}
                  onClick={() => onChange(withoutGroupName(selected, name))}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <FormField
        id={fieldId}
        label="Add to a group"
        hint={
          full
            ? `That is ${MAX_GROUPS_PER_RECIPE} groups — remove one to add another.`
            : 'Press Enter to create it'
        }
        error={error}
      >
        {({ id, describedBy, invalid }) => (
          <div className="group-add">
            <Input
              id={id}
              list={listId}
              value={draft}
              maxLength={GROUP_NAME_MAX}
              placeholder="Weeknight dinners"
              aria-describedby={describedBy}
              invalid={invalid}
              disabled={full}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                if (draft.trim()) add(draft);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={full || draft.trim() === ''}
              onClick={() => add(draft)}
            >
              Add
            </Button>
          </div>
        )}
      </FormField>

      <datalist id={listId}>
        {groups.map((group) => (
          <option key={group.id} value={group.name} />
        ))}
      </datalist>

      {suggestions.length > 0 && !full ? (
        <div className="group-suggestions">
          {suggestions.map((group) => (
            <button
              className="group-suggestion"
              type="button"
              key={group.id}
              onClick={() => add(group.name)}
            >
              <span aria-hidden="true">+</span> {group.name}
            </button>
          ))}
        </div>
      ) : null}

      {selected.length === 0 ? (
        <p className="editor__rail-empty">
          Not in a group yet. Anything works — a series, a season, or the meals you cook on a
          Tuesday.
        </p>
      ) : (
        selected.map((name) => (
          <GroupRelated key={groupNameKey(name)} name={name} groups={groups} recipeId={recipeId} />
        ))
      )}
    </aside>
  );
}

/** The vertical stack of recipes already in one group. */
function GroupRelated({
  name,
  groups,
  recipeId,
}: {
  name: string;
  groups: EditorGroup[];
  recipeId: string | undefined;
}) {
  const group = groups.find((candidate) => groupNameKey(candidate.name) === groupNameKey(name));
  const related = (group?.recipes ?? []).filter((recipe) => recipe.id !== recipeId);
  const headingId = `group-${groupNameKey(name)}-heading`;

  return (
    <section className="group-related" aria-labelledby={headingId}>
      <h3 className="group-related__title" id={headingId}>
        In {name}
      </h3>

      {related.length === 0 ? (
        <p className="group-related__empty">
          Nothing else here yet. Add this group to another recipe and both will show up.
        </p>
      ) : (
        <ul className="group-related__list">
          {related.map((recipe) => (
            <li key={recipe.id}>
              {/* A new tab, because the editor has no autosave and following a
                  link in the same tab would drop the document being written. */}
              <Link
                className="group-related__item"
                href={`/dashboard/recipes/${recipe.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {recipe.featuredImageUrl ? (
                  <img
                    className="group-related__thumb"
                    src={recipe.featuredImageUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="group-related__thumb" aria-hidden="true" />
                )}
                <span className="group-related__name">
                  {recipe.title || 'Untitled recipe'}
                  <span className="ui-visually-hidden"> (opens in a new tab)</span>
                </span>
                {recipe.status === 'DRAFT' ? <Badge tone="neutral">Draft</Badge> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
