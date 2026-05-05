import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? 'Editar Ciclo' : 'Nuevo Ciclo'}
          </DialogTitle>
          <DialogDescription>
            {defaultValues?.id
              ? 'Actualiza la información del ciclo contable.'
              : 'Crea un nuevo ciclo contable para tu empresa.'}
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
