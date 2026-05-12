import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { BankAccount } from '../services/bank-account-service';
import { BankAccountForm } from './bank-account-form';

interface BankAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<BankAccount>;
  mode?: 'create' | 'edit' | 'view';
}

export function BankAccountModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: BankAccountModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles de la Cuenta'
              : isEditMode
                ? 'Editar Cuenta Bancaria'
                : 'Nueva Cuenta Bancaria'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información de la cuenta bancaria.'
              : defaultValues?.id
                ? 'Actualiza la información de la cuenta bancaria.'
                : 'Complete los campos para crear una nueva cuenta bancaria.'}
          </DialogDescription>
        </DialogHeader>
        <BankAccountForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
