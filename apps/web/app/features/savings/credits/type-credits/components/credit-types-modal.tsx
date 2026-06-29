import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { type CreditTypeMutation } from '../schemas/credit-types.schema';
import { CreditTypesForm } from './credit-types-form';
import { CreditTypesViewModal } from './credit-types-view-modal';

interface CreditTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CreditTypeMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function CreditTypesModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: CreditTypesModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  if (isViewMode) {
    return (
      <CreditTypesViewModal
        open={open}
        onOpenChange={onOpenChange}
        creditType={defaultValues as any}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Tipo de Crédito' : 'Crear Tipo de Crédito'}
          </DialogTitle>
          <DialogDescription>
            {defaultValues?.id
              ? 'Actualiza la información del tipo de crédito.'
              : 'Complete los campos para crear un nuevo tipo de crédito.'}
          </DialogDescription>
        </DialogHeader>
        <CreditTypesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={false}
        />
      </DialogContent>
    </Dialog>
  );
}
