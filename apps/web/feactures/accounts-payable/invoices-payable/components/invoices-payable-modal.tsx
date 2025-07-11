'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { InvoicesPayable } from '../schemas/invoices-payable.schema';
import { InvoicePayableForm } from './invoices-payable-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<InvoicesPayable>;
  readOnly?: boolean;
}

export function InvoicePayableModal({
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
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Cuenta por Pagar'
              : defaultValues?.id
                ? 'Actualizar Cuenta'
                : 'Crear Cuenta'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información de la Cuenta por Pagar'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} la cuenta`}
          </DialogDescription>
        </DialogHeader>
        <InvoicePayableForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
