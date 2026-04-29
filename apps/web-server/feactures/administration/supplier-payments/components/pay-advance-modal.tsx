'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { AccountPayableSchemaAPI } from '../schemas/account-payable-api.schema';
import { PayAdvanceForm } from './pay-advance-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: AccountPayableSchemaAPI;
}

export function PayAdvanceModal({ open, onOpenChange, advance }: ModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago Anticipo</DialogTitle>
          <DialogDescription>Formulario realizar pago</DialogDescription>
        </DialogHeader>
        <PayAdvanceForm
          advance={advance}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
