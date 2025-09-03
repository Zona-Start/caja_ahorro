'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { SupplierPayment } from '../schemas';
import { SupplierPaymentForm } from './supplier-payment-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<SupplierPayment>;
  readOnly?: boolean;
}

export function SupplierPaymentModal({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Pago'
              : defaultValues?.id
                ? 'Actualizar Pago'
                : 'Crear Pago'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información del pago'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} el pago`}
          </DialogDescription>
        </DialogHeader>
        <SupplierPaymentForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
