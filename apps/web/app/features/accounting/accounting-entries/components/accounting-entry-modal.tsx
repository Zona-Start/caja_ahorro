import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { AccountingEntry } from '../schemas/accounting-entry.schema';
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? 'Editar Asiento Contable' : 'Nuevo Asiento Contable'}
          </DialogTitle>
          <DialogDescription>
            {defaultValues?.id
              ? 'Actualiza la información del asiento contable.'
              : 'Registra un nuevo movimiento contable manual.'}
          </DialogDescription>
        </DialogHeader>
        <AccountingEntryForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
