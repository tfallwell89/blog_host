'use client';

import { Button, type ButtonProps } from '@bloghost/ui';
import { useFormStatus } from 'react-dom';

export interface SubmitButtonProps extends Omit<ButtonProps, 'type' | 'disabled'> {
  pendingLabel?: string;
}

/** Submit button that disables itself while its parent form is submitting. */
export function SubmitButton({ children, pendingLabel = 'Saving…', ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
