import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useBankAccountQuery } from '../hooks/use-bank-account-query';
import type { BankAccount } from '../schemas/bank-account.schema';
import { BankAccountForm } from './bank-account-form';
import { BankAccountViewModal } from './bank-account-view-modal';

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
  const recordId = defaultValues?.id as string | undefined;

  const { data: fetchedData } = useBankAccountQuery(
    recordId || '',
    mode === 'view' && !!recordId,
  );

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  if (isViewMode) {
    const viewData = fetchedData?.data || defaultValues;
    return (
      <BankAccountViewModal
        open={open}
        onOpenChange={onOpenChange}
        data={(viewData as BankAccount) || null}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información de la cuenta bancaria.'
              : 'Complete los campos para crear una nueva cuenta bancaria.'}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-10rem)] -mr-3 pr-3">
          <BankAccountForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            defaultValues={isCreateMode ? undefined : defaultValues}
            disabled={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
