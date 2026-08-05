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
