import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { type LoanTypeMutation } from '../schemas/loan-types.schema';
import { LoanTypesForm } from './loan-types-form';
import { LoanTypesViewModal } from './loan-types-view-modal';

interface LoanTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<LoanTypeMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function LoanTypesModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: LoanTypesModalProps) {
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
      <LoanTypesViewModal
        open={open}
        onOpenChange={onOpenChange}
        loanType={defaultValues as any}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Tipo de Préstamo' : 'Crear Tipo de Préstamo'}
          </DialogTitle>
          <DialogDescription>
            {defaultValues?.id
              ? 'Actualiza la información del tipo de préstamo.'
              : 'Complete los campos para crear un nuevo tipo de préstamo.'}
          </DialogDescription>
        </DialogHeader>
        <LoanTypesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={false}
        />
      </DialogContent>
    </Dialog>
  );
}
