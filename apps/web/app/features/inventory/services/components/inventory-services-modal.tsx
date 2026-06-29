import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { InventoryService } from '../schemas/inventory-services.schema';
import { InventoryServiceForm } from './inventory-services-form';

interface InventoryServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<InventoryService>;
  mode?: 'create' | 'edit' | 'view';
}

export function InventoryServiceModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: InventoryServiceModalProps) {
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Servicio'
              : isEditMode
                ? 'Editar Servicio'
                : 'Nuevo Servicio'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del servicio de inventario.'
              : isEditMode
                ? 'Actualiza la información del servicio de inventario.'
                : 'Crea un nuevo servicio para el inventario.'}
          </DialogDescription>
        </DialogHeader>
        <InventoryServiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
