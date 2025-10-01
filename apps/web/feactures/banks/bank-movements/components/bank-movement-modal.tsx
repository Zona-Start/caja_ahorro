'use client';

import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { BankMovement } from '../schemas/bank-movement.schema';
import { BankMovementForm } from './bank-movement-form';

interface BankMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<BankMovement>;
}

export function BankMovementModal({
  open,
  onOpenChange,
  defaultValues,
}: BankMovementModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] z-50 ">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id
              ? 'Actualizar Movimiento Bancario'
              : 'Crear Movimiento Bancario'}
          </DialogTitle>
          <DialogDescription>
            Complete el formulario para registrar un nuevo movimiento bancario.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <BankMovementForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            defaultValues={defaultValues}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
