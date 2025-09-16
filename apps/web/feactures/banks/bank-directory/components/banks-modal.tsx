'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Banks } from '../schemas/banks.schema';
import { BanksPlanForm } from './banks-form';

interface BanksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Banks>;
}

export function BanksModal({
  open,
  onOpenChange,
  defaultValues,
}: BanksModalProps) {
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
      <DialogContent className="sm:max-w-[600px] z-50 ">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? 'Actualizar Banco' : 'Crear Banco'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el banco
          </DialogDescription>
        </DialogHeader>
        <BanksPlanForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
