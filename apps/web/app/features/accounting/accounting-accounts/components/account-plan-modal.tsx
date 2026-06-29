import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { AccountPlanApiResponse } from '../schemas/account-plan-api';
import type { AccountPlan } from '../schemas/account-plan.schema';
import { AccountPlanForm } from './account-plan-form';

interface AccountPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AccountPlanApiResponse>;
  mode?: 'create' | 'edit';
}

export function AccountPlanModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: AccountPlanModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] z-50">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Actualizar Cuenta Contable'
              : 'Crear Cuenta Contable'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información de la cuenta contable.'
              : 'Completa los campos para crear una nueva cuenta contable.'}
          </DialogDescription>
        </DialogHeader>
        <AccountPlanForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues as unknown as Partial<AccountPlan>}
        />
      </DialogContent>
    </Dialog>
  );
}
