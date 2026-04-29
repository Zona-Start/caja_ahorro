'use client';

import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { AccountingEntry } from '../schemas/accounting-entry.schema';
import { AccountingEntryForm } from './accounting-entry-form';

interface AccountingEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AccountingEntry>;
}

export function AccountingEntryModal({
  open,
  onOpenChange,
  defaultValues,
}: AccountingEntryModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] z-50 ">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id
              ? 'Actualizar Asiento Contable'
              : 'Crear Asiento Contable'}
          </DialogTitle>
          <DialogDescription>
            Complete el formulario para registrar un nuevo asiento contable.
            Recuerde que el debe y el haber deben ser iguales.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <AccountingEntryForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            defaultValues={defaultValues}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
