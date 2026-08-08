'use client';

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';

import { cn } from './cn';

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Optional controls or context displayed directly below the title bar. */
  toolbar?: ReactNode;
  className?: string;
}

/**
 * Controlled content modal built on the native `<dialog>` element. It provides
 * focus trapping, Escape handling, a labelled header and a scrollable content
 * region while leaving the modal's contents and toolbar to the application.
 */
export function Modal({ open, title, children, onClose, toolbar, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn('ui-modal', className)}
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="ui-modal__body">
        <header className="ui-modal__header">
          <h2 className="ui-modal__title" id={titleId}>
            {title}
          </h2>
          <button className="ui-modal__close" type="button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        {toolbar ? <div className="ui-modal__toolbar">{toolbar}</div> : null}
        <div className="ui-modal__content">{children}</div>
      </div>
    </dialog>
  );
}
