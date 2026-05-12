import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { BankMovement } from '../schemas/bank-movement.schema';
import { BankMovementForm } from './bank-movement-form';

interface BankMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<BankMovement>;
  mode?: 'create' | 'edit' | 'view';
}

export function BankMovementModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: BankMovementModalProps) {
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
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Movimiento'
              : isEditMode
                ? 'Editar Movimiento'
                : 'Nuevo Movimiento Bancario'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del movimiento bancario.'
              : defaultValues?.id
                ? 'Actualiza la información del movimiento bancario.'
                : 'Complete los campos para registrar un nuevo movimiento.'}
          </DialogDescription>
        </DialogHeader>
        <BankMovementForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
