'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { AccountPayable } from '../schemas/account-payable.schema';
import { CreditDebitNoteForm } from './credit-debit-note-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountPayable: AccountPayable;
}

export function CreditDebitNoteModal({
  open,
  onOpenChange,
  accountPayable,
}: ModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[800px] z-50 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>Nota de Crédito/Débito</DialogTitle>
          <DialogDescription>
            Complete los campos para crear una nota de crédito o débito.
          </DialogDescription>
        </DialogHeader>
        <CreditDebitNoteForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          accountPayable={accountPayable}
        />
      </DialogContent>
    </Dialog>
  );
}
