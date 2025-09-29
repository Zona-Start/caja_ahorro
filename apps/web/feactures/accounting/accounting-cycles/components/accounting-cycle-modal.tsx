
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { AccountingCycle } from '../schemas/accounting-cycle.schema';
import { AccountingCycleForm } from './accounting-cycle-form';

interface AccountingCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AccountingCycle>;
}

export function AccountingCycleModal({
  open,
  onOpenChange,
  defaultValues,
}: AccountingCycleModalProps) {
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
            {defaultValues?.id
              ? 'Actualizar Ciclo Contable'
              : 'Crear Ciclo Contable'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el ciclo contable
          </DialogDescription>
        </DialogHeader>
        <AccountingCycleForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
