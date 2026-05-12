import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { Bank } from '../services/banks-service';
import { BanksForm } from './banks-form';

interface BanksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Bank>;
  mode?: 'create' | 'edit' | 'view';
}

export function BanksModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: BanksModalProps) {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Banco'
              : isEditMode
                ? 'Editar Banco'
                : 'Nuevo Banco'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del banco.'
              : defaultValues?.id
                ? 'Actualiza la información del banco.'
                : 'Complete los campos para registrar un nuevo banco.'}
          </DialogDescription>
        </DialogHeader>
        <BanksForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
