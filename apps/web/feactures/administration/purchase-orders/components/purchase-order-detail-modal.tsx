'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';

import { PurchaseOrderSchemaAPI } from '../schemas';
import { PurchaseOrderDetail } from './purchase-order-detail';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrderSchemaAPI;
}

export function PurchaseOrderDetailModal({
  open,
  onOpenChange,
  purchaseOrder,
}: ModalProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Orden de Compra</DialogTitle>
          <DialogDescription>
            Información detallada de la orden de compra.
          </DialogDescription>
        </DialogHeader>
        <PurchaseOrderDetail
          purchaseOrder={purchaseOrder}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
