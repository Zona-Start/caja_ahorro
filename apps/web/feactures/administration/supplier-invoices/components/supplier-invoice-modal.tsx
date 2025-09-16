'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';
import { SupplierInvoiceForm } from './supplier-invoice-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<SupplierInvoice>;
  readOnly?: boolean;
}

export function SupplierInvoiceModal({
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
              ? 'Ver Factura de Proveedor'
              : defaultValues?.id
                ? 'Actualizar Factura de Proveedor'
                : 'Cargar Factura de Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información de la Factura de Proveedor'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} la factura de proveedor`}
          </DialogDescription>
        </DialogHeader>
        <SupplierInvoiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
