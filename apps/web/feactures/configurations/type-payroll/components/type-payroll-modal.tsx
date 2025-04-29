'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { TypePayrolls } from '../schemas/type-payroll.schema';
import { TypePayrollForm } from './type-payroll-form';

interface TypePayrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TypePayrolls>;
  readOnly?: boolean; // Add this prop definition
}

export function TypePayrollModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: TypePayrollModalProps) {
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
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg bg-background/80 overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Tipo de Nomina'
              : defaultValues
                ? 'Editar Tipo de Nomina'
                : 'Crear Tipo de Nomina'}
          </DialogTitle>
          {!readOnly && (
            <DialogDescription>
              Complete los campos para{' '}
              {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de nomina.
            </DialogDescription>
          )}
        </DialogHeader>
        <TypePayrollForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
