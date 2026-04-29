'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';

import { OneSupplierPaymentSchemaAPI } from '../schemas/account-payable-api.schema';
import { PayAccountPayableForm } from './pay-account-payable-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OneSupplierPaymentSchemaAPI;
}

export function PayAccountPayableModal({
  open,
  onOpenChange,
  data,
}: ModalProps) {
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
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Formulario para registrar pago de la cuenta por pagar #{' '}
            {data.account.accountsPayableNumber}
          </DialogDescription>
        </DialogHeader>
        <PayAccountPayableForm
          data={data}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
