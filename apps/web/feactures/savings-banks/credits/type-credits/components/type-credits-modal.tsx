'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { TypeCredit } from '../schemas/type-credits.schema';
import { TypeCreditsForm } from './type-credits-form';

interface TypeCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TypeCredit>;
  readOnly?: boolean; // Add this prop definition
}

export function TypeCreditsModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: TypeCreditsModalProps) {
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
            {defaultValues ? 'Editar Tipo de Crédito' : 'Crear Tipo de Crédito'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de crédito
          </DialogDescription>
        </DialogHeader>
        <TypeCreditsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
