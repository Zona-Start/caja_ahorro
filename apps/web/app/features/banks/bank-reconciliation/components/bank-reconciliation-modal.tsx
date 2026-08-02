import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { BankReconciliation } from '../schemas/bank-reconciliation.schema';
import { BankReconciliationForm } from './bank-reconciliation-form';

interface BankReconciliationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<BankReconciliation>;
  mode?: 'create' | 'edit' | 'view';
}

export function BankReconciliationModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: BankReconciliationModalProps) {
  const handleSuccess = () => onOpenChange(false);
  const handleCancel = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nueva Conciliación Bancaria</DialogTitle>
          <DialogDescription>
            Complete los campos para iniciar una conciliación bancaria. Una vez
            creada, podrá agregar movimientos manuales o importar un extracto
            desde Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-10rem)] -mr-3 pr-3">
          <BankReconciliationForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
