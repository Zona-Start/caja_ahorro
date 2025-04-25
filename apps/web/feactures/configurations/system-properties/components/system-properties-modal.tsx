'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { SettingSystem } from '../schemas/system-properties.schema';
import { SettingSystemForm } from './system-properties-form';

interface AccountPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<SettingSystem>;
}

export function SettingSystemModal({
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
              ? 'Actualizar Propiedad del Sistema'
              : 'Crear Propiedad del Sistema'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} la Propiedad del
            Sistema
          </DialogDescription>
        </DialogHeader>
        <SettingSystemForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
