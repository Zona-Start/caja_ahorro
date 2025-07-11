'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Supplier } from '../schemas/suppliers.schema';
import { SupplierForm } from './suppliers-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Supplier>;
  readOnly?: boolean;
}

export function SupplierModal({
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
              ? 'Ver Cuenta'
              : defaultValues?.id
                ? 'Actualizar Proveedor'
                : 'Crear Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información de la Proveedor'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} la proveedor`}
          </DialogDescription>
        </DialogHeader>
        <SupplierForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
