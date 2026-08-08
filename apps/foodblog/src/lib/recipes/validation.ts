import { z } from 'zod';

import { slugify } from '@/lib/slug';
import { isHttpUrl } from '@/lib/url';

export const RECIPE_STATUS_VALUES = ['DRAFT', 'PUBLISHED'] as const;
export const RECIPE_DIFFICULTY_VALUES = ['EASY', 'MEDIUM', 'HARD'] as const;

/** Length of a group name, and of the slug derived from it. */
export const GROUP_NAME_MAX = 60;
export const MAX_GROUPS_PER_RECIPE = 10;

const MINUTES_IN_A_WEEK = 60 * 24 * 7;

/** Empty string means "not provided" for every optional field in the editor. */
function optionalText(max: number, tooLong: string) {
  return z
    .string()
    .trim()
    .max(max, tooLong)
    .transform((value) => (value === '' ? null : value));
}

const optionalImageUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || isHttpUrl(value),
    'Enter a valid image URL starting with http:// or https://',
  )
  .transform((value) => (value === '' ? null : value));

function optionalWholeNumber(options: { max: number; label: string; tooLarge: string }) {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\d{1,6}$/.test(value),
      `${options.label} must be a whole number`,
    )
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || value <= options.max, options.tooLarge);
}

export const recipeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters')
  .max(80, 'Keep the address under 80 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens only');

/**
 * A group is addressed by the slug of its name, so a name that slugifies to
 * nothing ("???") could never be found again.
 */
export const groupNameSchema = z
  .string()
  .trim()
  .min(2, 'Give the group a name, for example "Weeknight dinners"')
  .max(GROUP_NAME_MAX, `Keep group names under ${GROUP_NAME_MAX} characters`)
  .refine((value) => slugify(value, GROUP_NAME_MAX) !== '', 'Use letters or numbers in the name');

export const ingredientSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Write the ingredient, for example "200g plain flour"')
    .max(200, 'Keep each ingredient under 200 characters'),
});

export const ingredientGroupSchema = z.object({
  title: optionalText(80, 'Keep group names under 80 characters'),
  ingredients: z
    .array(ingredientSchema)
    .max(60, 'That is a lot of ingredients — split them into another group'),
});

export const instructionStepSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Describe what the cook should do')
    .max(2000, 'Keep each step under 2000 characters'),
  imageUrl: optionalImageUrl,
});

export const instructionGroupSchema = z.object({
  title: optionalText(80, 'Keep group names under 80 characters'),
  steps: z
    .array(instructionStepSchema)
    .min(1, 'Add at least one step to this group')
    .max(40, 'That is a lot of steps — split them into another group'),
});

const recipeBaseShape = {
  title: z
    .string()
    .trim()
    .max(140, 'Keep the title under 140 characters'),
  description: z
    .string()
    .trim()
    .max(280, 'Keep the description under 280 characters'),
  introduction: optionalText(5000, 'Keep the introduction under 5000 characters'),
  storyTitle: optionalText(140, 'Keep the section heading under 140 characters'),
  storyBody: optionalText(10000, 'Keep the section body under 10000 characters'),
  storyImageUrl: optionalImageUrl,
  featuredImageUrl: optionalImageUrl,
  prepMinutes: optionalWholeNumber({
    max: MINUTES_IN_A_WEEK,
    label: 'Prep time',
    tooLarge: 'Prep time looks too long',
  }),
  cookMinutes: optionalWholeNumber({
    max: MINUTES_IN_A_WEEK,
    label: 'Cook time',
    tooLarge: 'Cook time looks too long',
  }),
  additionalMinutes: optionalWholeNumber({
    max: MINUTES_IN_A_WEEK,
    label: 'Additional time',
    tooLarge: 'Additional time looks too long',
  }),
  servings: optionalWholeNumber({
    max: 1000,
    label: 'Servings',
    tooLarge: 'That is a very large number of servings',
  }),
  cuisine: optionalText(60, 'Keep the cuisine under 60 characters'),
  course: optionalText(60, 'Keep the course under 60 characters'),
  difficulty: z
    .union([z.literal(''), z.enum(RECIPE_DIFFICULTY_VALUES)])
    .transform((value) => (value === '' ? null : value)),
  notes: optionalText(5000, 'Keep the notes under 5000 characters'),
  /** Names of the groups this recipe belongs to; missing ones are created. */
  groups: z
    .array(groupNameSchema)
    .max(MAX_GROUPS_PER_RECIPE, `A recipe can join ${MAX_GROUPS_PER_RECIPE} groups at most`),
  ingredientGroups: z
    .array(ingredientGroupSchema)
    .max(15, 'Fifteen ingredient groups is the maximum'),
};

const publishedRecipeSchema = z.object({
  ...recipeBaseShape,
  title: recipeBaseShape.title.min(3, 'Give your recipe a title'),
  slug: recipeSlugSchema,
  description: recipeBaseShape.description.min(
    10,
    'Write a short description readers will see in the recipe index',
  ),
  status: z.literal('PUBLISHED'),
  instructionGroups: z
    .array(instructionGroupSchema)
    .max(15, 'Fifteen instruction groups is the maximum'),
});

const draftRecipeSchema = z.object({
  ...recipeBaseShape,
  // Draft addresses do not need to be publishable yet. An empty address gets
  // an internal unique value so multiple untitled drafts can coexist.
  slug: z
    .string()
    .trim()
    .max(80, 'Keep the address under 80 characters')
    .transform((value) => value || `draft-${crypto.randomUUID()}`),
  status: z.literal('DRAFT'),
  instructionGroups: z
    .array(
      z.object({
        title: optionalText(80, 'Keep group names under 80 characters'),
        steps: z
          .array(
            z.object({
              text: z.string().trim().max(2000, 'Keep each step under 2000 characters'),
              imageUrl: optionalImageUrl,
            }),
          )
          .max(40, 'That is a lot of steps — split them into another group'),
      }),
    )
    .max(15, 'Fifteen instruction groups is the maximum'),
});

export const recipeInputSchema = z.discriminatedUnion('status', [
  draftRecipeSchema,
  publishedRecipeSchema,
]);

/** Shape the editor sends over the wire (every scalar is a string). */
export type RecipeFormValues = z.input<typeof recipeInputSchema>;
/** Shape after validation, ready to persist. */
export type RecipeInput = z.output<typeof recipeInputSchema>;
