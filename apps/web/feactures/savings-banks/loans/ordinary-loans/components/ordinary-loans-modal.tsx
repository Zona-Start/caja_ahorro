'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { AssociatesMutate } from '../schemas/ordinary-loans.schema';
import { AssociatesForm } from './ordinary-loans-form';

interface AssociatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AssociatesMutate>;
  readOnly?: boolean;
}

export function AssociatesModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: AssociatesModalProps) {
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
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Asociado'
              : defaultValues?.id
                ? 'Actualizar Asociado'
                : 'Crear Asociado'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información del asociado'
              : `Complete los campos para ${defaultValues?.id ? 'actualizar' : 'crear'} el asociado`}
          </DialogDescription>
        </DialogHeader>
        <AssociatesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
