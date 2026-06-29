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
  mode?: 'create' | 'edit';
}

export function AccountingCycleModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: AccountingCycleModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Ciclo Contable' : 'Nuevo Ciclo Contable'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información del ciclo contable.'
              : 'Crea un nuevo ciclo contable.'}
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
