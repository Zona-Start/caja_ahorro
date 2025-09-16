'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { SupplierTransaction } from '../schemas/supplier-transaction.schema';
import { SupplierTransactionForm } from './supplier-transaction-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<SupplierTransaction>;
  readOnly?: boolean;
}

export function SupplierTransactionModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
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
      <DialogContent className="sm:max-w-[1000px] z-50">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Transacción de Proveedor'
              : defaultValues?.id
                ? 'Actualizar Transacción de Proveedor'
                : 'Crear Transacción de Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información de la Transacción de Proveedor'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} la transacción de proveedor`}
          </DialogDescription>
        </DialogHeader>
        <SupplierTransactionForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
