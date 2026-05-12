import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { type LoanTypeMutation } from '../schemas/loan-types.schema';
import { LoanTypesForm } from './loan-types-form';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Tipo de Préstamo'
              : isEditMode
                ? 'Editar Tipo de Préstamo'
                : 'Crear Tipo de Préstamo'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del tipo de préstamo.'
              : defaultValues?.id
                ? 'Actualiza la información del tipo de préstamo.'
                : 'Complete los campos para crear un nuevo tipo de préstamo.'}
          </DialogDescription>
        </DialogHeader>
        <LoanTypesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}