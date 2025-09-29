'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';

import { AccountPayableForm } from './account-payable-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<any>;
  readOnly?: boolean;
}

export function AccountPayableModal({
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
              ? 'Ver Cuenta por Pagar'
              : defaultValues?.id
                ? 'Actualizar Cuenta por Pagar'
                : 'Crear Cuenta por Pagar'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información de la Cuenta por Pagar'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} la cuenta por pagar`}
          </DialogDescription>
        </DialogHeader>
        <AccountPayableForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
