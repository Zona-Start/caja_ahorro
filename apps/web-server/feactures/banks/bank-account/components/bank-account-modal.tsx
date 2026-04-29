'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { BankAccount } from '../schemas/bank-account.schema';
import { BankAccountForm } from './bank-account-form';

interface bankAccoutnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<BankAccount>;
  readOnly?: boolean;
}

export function BankAccountModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: bankAccoutnModalProps) {
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
      <DialogContent className="sm:max-w-[800px] z-50 ">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Cuenta'
              : defaultValues?.id
                ? 'Actualizar Cuenta bancaria'
                : 'Crear Cuenta bancaria'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información de la Cuenta bancaria'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} la cuenta bancaria`}
          </DialogDescription>
        </DialogHeader>
        <BankAccountForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
