'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { AccountPayable } from '../schemas';
import { PayAccountPayableForm } from './pay-account-payable-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountPayable: AccountPayable;
}

export function PayAccountPayableModal({
  open,
  onOpenChange,
  accountPayable,
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
        </DialogHeader>
        <PayAccountPayableForm
          accountPayable={accountPayable}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
