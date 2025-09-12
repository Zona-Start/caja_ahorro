'use client';

import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';
import { SupplierInvoiceDetails } from './supplier-invoice-details';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SupplierInvoice;
}

export function SupplierInvoiceDetailsModal({
  open,
  onOpenChange,
  invoice,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Factura</DialogTitle>
        </DialogHeader>
        <SupplierInvoiceDetails invoice={invoice} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
