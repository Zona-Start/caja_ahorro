import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { BankMovement } from '../schemas/bank-movement.schema';
import { BankMovementForm } from './bank-movement-form';
import { BankMovementViewModal } from './bank-movement-view-modal';

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
  const handleSuccess = () => onOpenChange(false);
  const handleCancel = () => onOpenChange(false);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  if (isViewMode) {
    return (
      <BankMovementViewModal
        open={open}
        onOpenChange={onOpenChange}
        data={defaultValues as BankMovement | null}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Movimiento' : 'Nuevo Movimiento Bancario'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información del movimiento bancario.'
              : 'Complete los campos para registrar un nuevo movimiento.'}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-10rem)] -mr-3 pr-3">
          <BankMovementForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            defaultValues={defaultValues}
            disabled={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
