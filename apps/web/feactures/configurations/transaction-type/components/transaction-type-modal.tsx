'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { TransactionType } from '../schemas/transaction-type.schema';
import { TransactionTypeForm } from './transaction-type-form';

interface TransactionTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TransactionType>;
  readOnly?: boolean;  // Add this prop definition
}

export function TransactionTypeModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false
}: TransactionTypeModalProps) {
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
            {readOnly ? 'Ver Tipo de Transacción' : defaultValues ? 'Editar Tipo de Transacción' : 'Crear Tipo de Transacción'} 
          </DialogTitle>
          {!readOnly && (
            <DialogDescription>
              Complete los campos para {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de transacción
            </DialogDescription>
          )}
        </DialogHeader>
        <TransactionTypeForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
