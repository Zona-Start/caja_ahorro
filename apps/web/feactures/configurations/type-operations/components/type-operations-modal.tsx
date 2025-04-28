'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { TypeOperations } from '../schemas/type-operations.schema';
import { TypeOperationsForm } from './type-operations-form';

interface TypeOperationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TypeOperations>;
  readOnly?: boolean; // Add this prop definition
}

export function TypeOperationsModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: TypeOperationsModalProps) {
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
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg bg-background/80 overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Tipo de Operación'
              : defaultValues
                ? 'Editar Tipo de operación'
                : 'Crear Tipo de operación'}
          </DialogTitle>
          {!readOnly && (
            <DialogDescription>
              Complete los campos para{' '}
              {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de operación.
            </DialogDescription>
          )}
        </DialogHeader>
        <TypeOperationsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
