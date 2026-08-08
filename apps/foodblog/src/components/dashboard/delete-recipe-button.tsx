'use client';

import { Button, ConfirmDialog } from '@bloghost/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { deleteRecipeAction } from '@/lib/recipes/actions';

export interface DeleteRecipeButtonProps {
  recipeId: string;
  recipeTitle: string;
}

export function DeleteRecipeButton({ recipeId, recipeTitle }: DeleteRecipeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteRecipeAction(recipeId);

      if (!result.ok) {
        setError(result.message);
        setOpen(false);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <svg
          className="recipe-row__delete-icon"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
        Delete
      </Button>

      <ConfirmDialog
        open={open}
        title="Delete this recipe?"
        description={`“${recipeTitle}” will be removed from your food blog, along with its ingredients and instructions. This cannot be undone.`}
        confirmLabel="Delete recipe"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!pending) setOpen(false);
        }}
      />

      {error ? (
        <span className="ui-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}
