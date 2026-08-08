'use client';

import { Modal, cn } from '@bloghost/ui';
import { useState } from 'react';

import { SiteHeader } from '@/components/site/site-header';
import { brandColorStyle } from '@/lib/blog/brand';
import { useMediaQuery } from '@/lib/use-media-query';

import { RecipePage, type RecipeByline, type RelatedGroup } from './recipe-page';
import type { RecipeDocument } from './recipe-document';

type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: ReadonlyArray<{ value: PreviewViewport; label: string }> = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'mobile', label: 'Mobile' },
];

export interface RecipePreviewModalProps {
  open: boolean;
  onClose: () => void;
  blog: {
    name: string;
    logoUrl: string | null;
    subdomain: string;
    brandColor: string;
  };
  recipe: RecipeDocument;
  byline: RecipeByline;
  indexHref: string;
  related: RelatedGroup[];
}

export function RecipePreviewModal({
  open,
  onClose,
  blog,
  recipe,
  byline,
  indexHref,
  related,
}: RecipePreviewModalProps) {
  const onSmallScreen = useMediaQuery('(max-width: 48rem)');
  const [chosenViewport, setChosenViewport] = useState<PreviewViewport | null>(null);
  const viewport = chosenViewport ?? (onSmallScreen ? 'mobile' : 'desktop');

  const toolbar = (
    <div className="recipe-preview__viewport-toggle" role="group" aria-label="Preview size">
      {VIEWPORTS.map((option) => (
        <button
          className="recipe-preview__viewport-button"
          type="button"
          key={option.value}
          aria-pressed={viewport === option.value}
          onClick={() => setChosenViewport(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <Modal open={open} title="Preview" toolbar={toolbar} onClose={onClose}>
      <div className={cn('recipe-preview__stage', `recipe-preview__stage--${viewport}`)}>
        <div
          className={cn('recipe-preview__frame', `recipe-preview__frame--${viewport}`)}
          aria-label={`${viewport} preview`}
        >
          <div className="recipe-preview__site site" style={brandColorStyle(blog.brandColor)} inert>
            <SiteHeader blog={blog} activePage="recipes" />
            <main className="site__main">
              <div className="site-container">
                <RecipePage
                  mode="preview"
                  recipe={recipe}
                  byline={byline}
                  indexHref={indexHref}
                  related={related}
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    </Modal>
  );
}
