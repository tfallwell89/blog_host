import type { RecipeDetail } from './queries';
import { toIsoDuration, totalMinutes } from './format';

export interface RecipeJsonLdOptions {
  recipe: RecipeDetail;
  authorName: string;
  blogName: string;
  url: string;
}

type JsonLd = Record<string, unknown>;

/**
 * schema.org/Recipe structured data. Only fields the cook actually filled in
 * are emitted — partial data is better than invented data for rich results.
 */
export function buildRecipeJsonLd({
  recipe,
  authorName,
  blogName,
  url,
}: RecipeJsonLdOptions): JsonLd {
  const ingredients = recipe.ingredientGroups.flatMap((group) =>
    group.ingredients.map((ingredient) => ingredient.text),
  );

  const instructions = recipe.instructionGroups.map((group, groupIndex) => ({
    '@type': 'HowToSection',
    name: group.title ?? `Part ${groupIndex + 1}`,
    itemListElement: group.steps.map((step, stepIndex) => ({
      '@type': 'HowToStep',
      position: stepIndex + 1,
      text: step.text,
      ...(step.imageUrl ? { image: step.imageUrl } : {}),
    })),
  }));

  const jsonLd: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: authorName },
    publisher: { '@type': 'Organization', name: blogName },
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
  };

  if (recipe.featuredImageUrl) jsonLd.image = [recipe.featuredImageUrl];
  if (recipe.publishedAt) jsonLd.datePublished = recipe.publishedAt.toISOString();
  jsonLd.dateModified = recipe.updatedAt.toISOString();

  const prepTime = toIsoDuration(recipe.prepMinutes);
  const cookTime = toIsoDuration(recipe.cookMinutes);
  const totalTime = toIsoDuration(totalMinutes(recipe));

  if (prepTime) jsonLd.prepTime = prepTime;
  if (cookTime) jsonLd.cookTime = cookTime;
  if (totalTime) jsonLd.totalTime = totalTime;
  if (recipe.servings) {
    jsonLd.recipeYield = `${recipe.servings} serving${recipe.servings === 1 ? '' : 's'}`;
  }
  if (recipe.cuisine) jsonLd.recipeCuisine = recipe.cuisine;
  if (recipe.course) jsonLd.recipeCategory = recipe.course;
  if (recipe.notes) jsonLd.recipeNotes = recipe.notes;

  return jsonLd;
}
