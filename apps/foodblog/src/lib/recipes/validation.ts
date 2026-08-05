import { z } from 'zod';

export const RECIPE_STATUS_VALUES = ['DRAFT', 'PUBLISHED'] as const;
export const RECIPE_DIFFICULTY_VALUES = ['EASY', 'MEDIUM', 'HARD'] as const;

const MINUTES_IN_A_WEEK = 60 * 24 * 7;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Empty string means "not provided" for every optional field in the editor. */
function optionalText(max: number, tooLong: string) {
  return z
    .string()
    .trim()
    .max(max, tooLong)
    .transform((value) => (value === '' ? null : value));
}

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
    .min(1, 'Add at least one ingredient to this group')
    .max(60, 'That is a lot of ingredients — split them into another group'),
});

export const instructionStepSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Describe what the cook should do')
    .max(2000, 'Keep each step under 2000 characters'),
});

export const instructionGroupSchema = z.object({
  title: optionalText(80, 'Keep group names under 80 characters'),
  steps: z
    .array(instructionStepSchema)
    .min(1, 'Add at least one step to this group')
    .max(40, 'That is a lot of steps — split them into another group'),
});

export const recipeInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Give your recipe a title')
    .max(140, 'Keep the title under 140 characters'),
  slug: recipeSlugSchema,
  description: z
    .string()
    .trim()
    .min(10, 'Write a short description readers will see in the recipe index')
    .max(280, 'Keep the description under 280 characters'),
  introduction: optionalText(5000, 'Keep the introduction under 5000 characters'),
  featuredImageUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || isHttpUrl(value),
      'Enter a valid image URL starting with http:// or https://',
    )
    .transform((value) => (value === '' ? null : value)),
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
  status: z.enum(RECIPE_STATUS_VALUES),
  ingredientGroups: z
    .array(ingredientGroupSchema)
    .min(1, 'A recipe needs at least one ingredient group')
    .max(15, 'Fifteen ingredient groups is the maximum'),
  instructionGroups: z
    .array(instructionGroupSchema)
    .min(1, 'A recipe needs at least one instruction group')
    .max(15, 'Fifteen instruction groups is the maximum'),
});

/** Shape the editor sends over the wire (every scalar is a string). */
export type RecipeFormValues = z.input<typeof recipeInputSchema>;
/** Shape after validation, ready to persist. */
export type RecipeInput = z.output<typeof recipeInputSchema>;
