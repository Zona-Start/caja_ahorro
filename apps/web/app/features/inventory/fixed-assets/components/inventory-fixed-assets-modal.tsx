import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useInventoryFixedAssetsModalStore } from '../store/inventory-fixed-assets-modal.store';
import { InventoryFixedAssetForm } from './inventory-fixed-assets-form';
import { InventoryFixedAssetsDetail } from './inventory-fixed-assets-detail';

export function InventoryFixedAssetModal() {
  const { isOpen, mode, data, closeModal } =
    useInventoryFixedAssetsModalStore();

  const handleSuccess = () => {
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
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
              ? 'Información detallada del activo fijo.'
              : isEditMode
                ? 'Actualiza la información del activo fijo.'
                : 'Crea un nuevo activo fijo en el inventario.'}
          </DialogDescription>
        </DialogHeader>
        {isViewMode ? (
          <InventoryFixedAssetsDetail
            data={data}
            onClose={handleCancel}
          />
        ) : (
          <InventoryFixedAssetForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            defaultValues={data}
            mode={mode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
