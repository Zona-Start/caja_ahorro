'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { AccountPlan } from '../schemas/account-plan.schema';
import { AccountPlanForm } from './account-plan-form';

interface AccountPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AccountPlan>;
}

export function AccountPlanModal({
  open,
  onOpenChange,
  defaultValues,
}: AccountPlanModalProps) {
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
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg bg-background/80">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id
              ? 'Actualizar Cuenta Contable'
              : 'Crear Cuenta Contable'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para {defaultValues?.id ? 'actualizar' : 'crear'} la cuenta contable
          </DialogDescription>
        </DialogHeader>
        <AccountPlanForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
