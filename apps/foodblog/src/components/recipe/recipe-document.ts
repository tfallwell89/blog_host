import { DIFFICULTY_LABELS, formatMinutes, totalMinutes } from '@/lib/recipes/format';
import type { RecipeFormValues } from '@/lib/recipes/validation';

/**
 * The recipe document.
 *
 * One structure drives every rendering mode — the editing canvas, the preview
 * and the published page — so there is a single description of what a recipe
 * is. Every scalar is a string because the editor is the only writer and the
 * server schema parses the same shape back into numbers.
 */
export interface RecipeDocument {
  title: string;
  slug: string;
  description: string;
  introduction: string;
  featuredImageUrl: string;
  prepMinutes: string;
  cookMinutes: string;
  additionalMinutes: string;
  servings: string;
  cuisine: string;
  course: string;
  difficulty: RecipeDifficultyValue;
  notes: string;
  ingredientGroups: RecipeGroup[];
  instructionGroups: RecipeGroup[];
}

/**
 * Ingredient groups and instruction groups are the same thing — a titled list
 * of ordered lines — so the document models them with one type.
 */
export interface RecipeGroup {
  key: string;
  title: string;
  items: RecipeItem[];
}

export interface RecipeItem {
  key: string;
  text: string;
}

/** Keys of the two group collections, used to address them generically. */
export type RecipeGroupField = 'ingredientGroups' | 'instructionGroups';

/** The empty string means "not specified", matching the wire format. */
export type RecipeDifficultyValue = RecipeFormValues['difficulty'];

export function toDifficulty(value: string): RecipeDifficultyValue {
  return value === 'EASY' || value === 'MEDIUM' || value === 'HARD' ? value : '';
}

/**
 * Server and browser each get their own key space. Without this, a line added
 * in the browser could reuse a key the server already handed out.
 */
const KEY_SCOPE = typeof window === 'undefined' ? 's' : 'c';
let keyCounter = 0;

export function nextKey(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${KEY_SCOPE}${keyCounter}`;
}

export function emptyItem(): RecipeItem {
  return { key: nextKey('item'), text: '' };
}

export function emptyGroup(): RecipeGroup {
  return { key: nextKey('group'), title: '', items: [emptyItem()] };
}

export function updateAt<T>(items: T[], index: number, updater: (item: T) => T): T[] {
  return items.map((item, currentIndex) => (currentIndex === index ? updater(item) : item));
}

export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

export function insertAt<T>(items: T[], index: number, item: T): T[] {
  const next = [...items];
  next.splice(index, 0, item);
  return next;
}

/** Moves an entry by `offset` positions, clamped to the bounds of the list. */
export function moveBy<T>(items: T[], index: number, offset: number): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  const [moved] = next.splice(index, 1);
  if (moved === undefined) return items;

  next.splice(target, 0, moved);
  return next;
}

/* Recipe facts ------------------------------------------------------------ */

/** Fields a fact is edited through, other than the difficulty enum. */
export type RecipeTextFactField =
  'prepMinutes' | 'cookMinutes' | 'additionalMinutes' | 'servings' | 'cuisine' | 'course';

interface RecipeFactBase {
  key: string;
  label: string;
  placeholder: string;
}

/**
 * A fact carries the document field it is edited through, so the canvas can
 * bind a control to it without a second table of field names.
 */
type RecipeFactDefinition = RecipeFactBase &
  (
    | { kind: 'minutes' | 'count' | 'text'; field: RecipeTextFactField }
    | { kind: 'difficulty'; field: 'difficulty' }
    | { kind: 'total'; field: null }
  );

/** Formatted `value` is null when the cook left the fact out. */
export type RecipeFact = RecipeFactDefinition & { value: string | null };

/**
 * The strip of facts under the hero image. Declared once so the editing
 * canvas and the published page can never show a different set.
 */
const RECIPE_FACTS: readonly RecipeFactDefinition[] = [
  { key: 'prep', label: 'Prep', field: 'prepMinutes', kind: 'minutes', placeholder: '10' },
  { key: 'cook', label: 'Cook', field: 'cookMinutes', kind: 'minutes', placeholder: '25' },
  { key: 'extra', label: 'Extra', field: 'additionalMinutes', kind: 'minutes', placeholder: '0' },
  { key: 'total', label: 'Total', field: null, kind: 'total', placeholder: '' },
  { key: 'servings', label: 'Serves', field: 'servings', kind: 'count', placeholder: '4' },
  { key: 'course', label: 'Course', field: 'course', kind: 'text', placeholder: 'Main course' },
  { key: 'cuisine', label: 'Cuisine', field: 'cuisine', kind: 'text', placeholder: 'Italian' },
  {
    key: 'difficulty',
    label: 'Difficulty',
    field: 'difficulty',
    kind: 'difficulty',
    placeholder: '',
  },
];

export const DIFFICULTY_OPTIONS: readonly { value: RecipeDifficultyValue; label: string }[] = [
  { value: '', label: 'Not specified' },
  { value: 'EASY', label: DIFFICULTY_LABELS.EASY },
  { value: 'MEDIUM', label: DIFFICULTY_LABELS.MEDIUM },
  { value: 'HARD', label: DIFFICULTY_LABELS.HARD },
];

/** Whole minutes, or null while the cook is midway through typing. */
export function toMinutes(value: string): number | null {
  const trimmed = value.trim();
  return /^\d{1,6}$/.test(trimmed) ? Number(trimmed) : null;
}

function factValue(recipe: RecipeDocument, definition: RecipeFactDefinition): string | null {
  switch (definition.kind) {
    case 'total':
      return formatMinutes(
        totalMinutes({
          prepMinutes: toMinutes(recipe.prepMinutes),
          cookMinutes: toMinutes(recipe.cookMinutes),
          additionalMinutes: toMinutes(recipe.additionalMinutes),
        }),
      );
    case 'minutes':
      return formatMinutes(toMinutes(recipe[definition.field]));
    case 'difficulty':
      return recipe.difficulty === '' ? null : DIFFICULTY_LABELS[recipe.difficulty];
    default:
      return recipe[definition.field].trim() || null;
  }
}

/**
 * Facts for the strip. Readers only see the ones that were filled in; the
 * editor asks for every slot so the cook knows what is on offer.
 */
export function recipeFacts(recipe: RecipeDocument, includeEmpty: boolean): RecipeFact[] {
  return RECIPE_FACTS.map((definition): RecipeFact => ({
    ...definition,
    value: factValue(recipe, definition),
  })).filter((fact) => includeEmpty || fact.value !== null);
}

/* Conversions ------------------------------------------------------------- */

function toWireGroups(groups: RecipeGroup[]) {
  return groups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({ text: item.text })),
  }));
}

/** Converts the document into the payload the server action validates. */
export function toFormValues(
  recipe: RecipeDocument,
  status: RecipeFormValues['status'],
): RecipeFormValues {
  return {
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    introduction: recipe.introduction,
    featuredImageUrl: recipe.featuredImageUrl,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    additionalMinutes: recipe.additionalMinutes,
    servings: recipe.servings,
    cuisine: recipe.cuisine,
    course: recipe.course,
    difficulty: recipe.difficulty,
    notes: recipe.notes,
    status,
    ingredientGroups: toWireGroups(recipe.ingredientGroups).map((group) => ({
      title: group.title,
      ingredients: group.items,
    })),
    instructionGroups: toWireGroups(recipe.instructionGroups).map((group) => ({
      title: group.title,
      steps: group.items,
    })),
  };
}

/**
 * Structural view of a stored recipe. Declared here rather than imported from
 * the query layer so this module never drags Prisma into the client bundle.
 */
export interface StoredRecipe {
  title: string;
  slug: string;
  description: string;
  introduction: string | null;
  featuredImageUrl: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  additionalMinutes: number | null;
  servings: number | null;
  cuisine: string | null;
  course: string | null;
  difficulty: string | null;
  notes: string | null;
  ingredientGroups: { title: string | null; ingredients: { text: string }[] }[];
  instructionGroups: { title: string | null; steps: { text: string }[] }[];
}

function toGroups(groups: { title: string | null; items: { text: string }[] }[]): RecipeGroup[] {
  if (groups.length === 0) return [emptyGroup()];

  return groups.map((group) => ({
    key: nextKey('group'),
    title: group.title ?? '',
    items:
      group.items.length > 0
        ? group.items.map((item) => ({ key: nextKey('item'), text: item.text }))
        : [emptyItem()],
  }));
}

function numberToField(value: number | null): string {
  return value === null ? '' : String(value);
}

export function toRecipeDocument(recipe: StoredRecipe): RecipeDocument {
  return {
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    introduction: recipe.introduction ?? '',
    featuredImageUrl: recipe.featuredImageUrl ?? '',
    prepMinutes: numberToField(recipe.prepMinutes),
    cookMinutes: numberToField(recipe.cookMinutes),
    additionalMinutes: numberToField(recipe.additionalMinutes),
    servings: numberToField(recipe.servings),
    cuisine: recipe.cuisine ?? '',
    course: recipe.course ?? '',
    difficulty: toDifficulty(recipe.difficulty ?? ''),
    notes: recipe.notes ?? '',
    ingredientGroups: toGroups(
      recipe.ingredientGroups.map((group) => ({ title: group.title, items: group.ingredients })),
    ),
    instructionGroups: toGroups(
      recipe.instructionGroups.map((group) => ({ title: group.title, items: group.steps })),
    ),
  };
}

export function emptyRecipeDocument(): RecipeDocument {
  return {
    title: '',
    slug: '',
    description: '',
    introduction: '',
    featuredImageUrl: '',
    prepMinutes: '',
    cookMinutes: '',
    additionalMinutes: '',
    servings: '',
    cuisine: '',
    course: '',
    difficulty: '',
    notes: '',
    ingredientGroups: [emptyGroup()],
    instructionGroups: [emptyGroup()],
  };
}
