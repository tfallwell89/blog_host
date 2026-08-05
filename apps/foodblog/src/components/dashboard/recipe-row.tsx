import { Badge } from '@bloghost/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { STATUS_LABELS, formatDate } from '@/lib/recipes/format';
import type { RecipeListItem } from '@/lib/recipes/queries';

export interface RecipeRowProps {
  recipe: RecipeListItem;
  actions?: ReactNode;
}

export function RecipeRow({ recipe, actions }: RecipeRowProps) {
  const isPublished = recipe.status === 'PUBLISHED';

  return (
    <div className="recipe-row">
      <div className="recipe-row__main">
        <h3 className="recipe-row__title">
          <Link href={`/dashboard/recipes/${recipe.id}`}>{recipe.title}</Link>
          <Badge tone={isPublished ? 'success' : 'warning'}>{STATUS_LABELS[recipe.status]}</Badge>
        </h3>
        <p className="recipe-row__meta">
          <span>Updated {formatDate(recipe.updatedAt)}</span>
          <span>
            {isPublished ? `Published ${formatDate(recipe.publishedAt)}` : 'Not published yet'}
          </span>
        </p>
      </div>
      {actions ? <div className="recipe-row__actions">{actions}</div> : null}
    </div>
  );
}
