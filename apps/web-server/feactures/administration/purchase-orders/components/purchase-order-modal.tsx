'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { PurchaseOrder } from '../schemas/purchase-order.schema';
import { PurchaseOrderForm } from './purchase-order-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<PurchaseOrder>;
  readOnly?: boolean;
}

export function PurchaseOrderModal({
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
      <DialogContent className="sm:max-w-[1000px] z-50 ">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Orden de Compra'
              : defaultValues?.id
                ? 'Actualizar Orden de Compra'
                : 'Crear Orden de Compra'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información de la Orden de Compra'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} la orden de compra`}
          </DialogDescription>
        </DialogHeader>
        <PurchaseOrderForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
