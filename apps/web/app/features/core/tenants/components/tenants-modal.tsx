import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { TenantMutation } from '../schemas/tenants.schema';
import { TenantsForm } from './tenants-form';

interface TenantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TenantMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function TenantsModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: TenantsModalProps) {
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
              ? 'Detalles del Cliente'
              : isEditMode
                ? 'Editar Cliente'
                : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa del cliente.'
              : isEditMode
                ? 'Actualiza la información del cliente.'
                : 'Crea un nuevo cliente para el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <TenantsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
