import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { type WithdrawalTypeMutation } from '../schemas/withdrawal-types.schema';
import { WithdrawalTypesForm } from './withdrawal-types-form';

interface WithdrawalTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<WithdrawalTypeMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function WithdrawalTypesModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: WithdrawalTypesModalProps) {
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Tipo de Retiro'
              : isEditMode
                ? 'Editar Tipo de Retiro'
                : 'Crear Tipo de Retiro'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del tipo de retiro.'
              : defaultValues?.id
                ? 'Actualiza la información del tipo de retiro.'
                : 'Complete los campos para crear un nuevo tipo de retiro.'}
          </DialogDescription>
        </DialogHeader>
        <WithdrawalTypesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}