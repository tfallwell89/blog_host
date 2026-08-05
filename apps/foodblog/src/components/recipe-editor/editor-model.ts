import type { RecipeFormValues } from '@/lib/recipes/validation';

/**
 * Ingredient groups and instruction groups share the same shape — a titled
 * list of ordered lines — so the editor models them with one type.
 */
export interface EditorItem {
  key: string;
  text: string;
}

export interface EditorGroup {
  key: string;
  title: string;
  items: EditorItem[];
}

/** The empty string means "not specified", matching the wire format. */
export type EditorDifficulty = RecipeFormValues['difficulty'];

export function toDifficulty(value: string): EditorDifficulty {
  return value === 'EASY' || value === 'MEDIUM' || value === 'HARD' ? value : '';
}

export interface RecipeEditorState {
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
  difficulty: EditorDifficulty;
  notes: string;
  ingredientGroups: EditorGroup[];
  instructionGroups: EditorGroup[];
}

let keyCounter = 0;

/** Stable React keys. Deterministic so server and client renders line up. */
export function nextKey(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

export function emptyItem(): EditorItem {
  return { key: nextKey('item'), text: '' };
}

export function emptyGroup(): EditorGroup {
  return { key: nextKey('group'), title: '', items: [emptyItem()] };
}

export function updateAt<T>(items: T[], index: number, updater: (item: T) => T): T[] {
  return items.map((item, currentIndex) => (currentIndex === index ? updater(item) : item));
}

export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, currentIndex) => currentIndex !== index);
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

function toWireGroups(groups: EditorGroup[]) {
  return groups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({ text: item.text })),
  }));
}

/** Converts editor state into the payload the server action validates. */
export function toFormValues(
  state: RecipeEditorState,
  status: RecipeFormValues['status'],
): RecipeFormValues {
  return {
    title: state.title,
    slug: state.slug,
    description: state.description,
    introduction: state.introduction,
    featuredImageUrl: state.featuredImageUrl,
    prepMinutes: state.prepMinutes,
    cookMinutes: state.cookMinutes,
    additionalMinutes: state.additionalMinutes,
    servings: state.servings,
    cuisine: state.cuisine,
    course: state.course,
    difficulty: state.difficulty,
    notes: state.notes,
    status,
    ingredientGroups: toWireGroups(state.ingredientGroups).map((group) => ({
      title: group.title,
      ingredients: group.items,
    })),
    instructionGroups: toWireGroups(state.instructionGroups).map((group) => ({
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

function toEditorGroups(
  groups: { title: string | null; items: { text: string }[] }[],
): EditorGroup[] {
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

export function toEditorState(recipe: StoredRecipe): RecipeEditorState {
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
    ingredientGroups: toEditorGroups(
      recipe.ingredientGroups.map((group) => ({ title: group.title, items: group.ingredients })),
    ),
    instructionGroups: toEditorGroups(
      recipe.instructionGroups.map((group) => ({ title: group.title, items: group.steps })),
    ),
  };
}

export function emptyRecipeState(): RecipeEditorState {
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
