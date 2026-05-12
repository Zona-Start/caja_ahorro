import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { InventoryFixedAsset } from '../schemas/inventory-fixed-assets.schema';
import { InventoryFixedAssetForm } from './inventory-fixed-assets-form';

interface InventoryFixedAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<InventoryFixedAsset>;
  mode?: 'create' | 'edit' | 'view';
}

export function InventoryFixedAssetModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: InventoryFixedAssetModalProps) {
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Activo Fijo'
              : isEditMode
                ? 'Editar Activo Fijo'
                : 'Nuevo Activo Fijo'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del activo fijo.'
              : isEditMode
                ? 'Actualiza la información del activo fijo.'
                : 'Crea un nuevo activo fijo en el inventario.'}
          </DialogDescription>
        </DialogHeader>
        <InventoryFixedAssetForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
