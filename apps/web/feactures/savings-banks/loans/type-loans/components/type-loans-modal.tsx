'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { TypeLoan } from '../schemas/type-loans.schema';
import { TypeLoansForm } from './type-loans-form';

interface TypeLoansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TypeLoan>;
  readOnly?: boolean; // Add this prop definition
}

export function TypeLoansModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: TypeLoansModalProps) {
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
            {defaultValues
              ? 'Editar Tipo de Prestamo'
              : 'Crear Tipo de Prestamo'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de prestamo
          </DialogDescription>
        </DialogHeader>
        <TypeLoansForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
