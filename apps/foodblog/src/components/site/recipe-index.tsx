'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

import { blogRecipePath } from '@/lib/tenant';

export interface RecipeIndexItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  eyebrow: string | null;
  timing: string | null;
}

export interface RecipeIndexProps {
  recipes: RecipeIndexItem[];
  subdomain: string;
}

export function RecipeIndex({ recipes, subdomain }: RecipeIndexProps) {
  const [query, setQuery] = useState('');
  const searchId = useId();

  const normalised = query.trim().toLowerCase();
  const visible = normalised
    ? recipes.filter((recipe) => recipe.title.toLowerCase().includes(normalised))
    : recipes;

  return (
    <div>
      <div className="index__head">
        <div>
          <h1 className="index__title">Recipes</h1>
          <p className="index__count" role="status">
            {visible.length} {visible.length === 1 ? 'recipe' : 'recipes'}
            {normalised ? ` matching “${query.trim()}”` : ''}
          </p>
        </div>

        <div className="recipe-search">
          <label className="ui-visually-hidden" htmlFor={searchId}>
            Search recipes by title
          </label>
          <input
            className="recipe-search__input"
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search recipes…"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="site-empty">
          No recipes match that search yet. Try a different word, or browse everything.
        </p>
      ) : (
        <ul className="recipe-grid">
          {visible.map((recipe) => (
            <li className="recipe-card" key={recipe.id}>
              {recipe.imageUrl ? (
                <img
                  className="recipe-card__image"
                  src={recipe.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="recipe-card__image" />
              )}
              <div className="recipe-card__body">
                {recipe.eyebrow ? <p className="recipe-card__eyebrow">{recipe.eyebrow}</p> : null}
                <h2 className="recipe-card__title">
                  <Link href={blogRecipePath(subdomain, recipe.slug)}>{recipe.title}</Link>
                </h2>
                <p className="recipe-card__description">{recipe.description}</p>
                {recipe.timing ? <p className="recipe-card__meta">{recipe.timing}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
