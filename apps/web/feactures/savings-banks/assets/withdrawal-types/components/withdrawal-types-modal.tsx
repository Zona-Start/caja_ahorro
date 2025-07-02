'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { WithdrawalTypes } from '../schemas/withdrawal-types.schema';
import { WithdrawalTypesForm } from './withdrawal-types-form';

interface WithdrawalTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<WithdrawalTypes>;
  readOnly?: boolean; // Add this prop definition
}

export function WithdrawalTypesModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: WithdrawalTypesModalProps) {
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
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg bg-background/80">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Editar Tipo de Rétiro' : 'Crear Tipo de Rétiro'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de rétiro
          </DialogDescription>
        </DialogHeader>
        <WithdrawalTypesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
