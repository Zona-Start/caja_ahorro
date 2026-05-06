import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { CurrencyMutation } from '../schemas/currencies.schema';
import { CurrenciesForm } from './currencies-form';

interface CurrenciesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CurrencyMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function CurrenciesModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: CurrenciesModalProps) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles de la Moneda'
              : isEditMode
                ? 'Editar Moneda'
                : 'Nueva Moneda'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa de la moneda.'
              : isEditMode
                ? 'Actualiza la información de la moneda.'
                : 'Crea una nueva moneda para el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <CurrenciesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}