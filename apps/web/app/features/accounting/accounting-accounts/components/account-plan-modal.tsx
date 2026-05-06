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
  mode?: 'create' | 'edit' | 'view';
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

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px] z-50 ">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles de Cuenta Contable'
              : isEditMode
                ? 'Actualizar Cuenta Contable'
                : 'Crear Cuenta Contable'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información de la cuenta contable.'
              : `Complete los campos para ${isEditMode ? 'actualizar' : 'crear'} la cuenta contable`}
          </DialogDescription>
        </DialogHeader>
        <AccountPlanForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues as unknown as Partial<AccountPlan>}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
