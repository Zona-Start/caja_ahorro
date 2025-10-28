'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { AccountingConfiguration } from '../schemas/accounting-configuration.schema';
import { AccountingConfigurationForm } from './accounting-configuration-form';

interface AccountingConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AccountingConfiguration>;
}

export function AccountingConfigurationModal({
  open,
  onOpenChange,
  defaultValues,
}: AccountingConfigurationModalProps) {
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
              ? 'Actualizar Configuración Contable'
              : 'Crear Configuración Contable'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} la configuración contable
          </DialogDescription>
        </DialogHeader>
        <AccountingConfigurationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
