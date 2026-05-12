import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { SupplierMutation, Supplier } from '../schemas/suppliers.schema';
import { useSuppliersModalStore } from '../store/suppliers-modal.store';
import { SuppliersForm } from './suppliers-form';

function toFormValues(supplier: Supplier): Partial<SupplierMutation> {
  return Object.fromEntries(
    Object.entries(supplier).map(([key, value]) => [
      key,
      value === null ? undefined : value,
    ]),
  ) as Partial<SupplierMutation>;
}

export function SuppliersModal() {
  const { isOpen, mode, data, closeModal } = useSuppliersModalStore();

  const handleSuccess = () => {
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Proveedor'
              : isEditMode
                ? 'Editar Proveedor'
                : 'Nuevo Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa del proveedor.'
              : isEditMode
                ? 'Actualiza la información del proveedor.'
                : 'Crea un nuevo proveedor en el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <SuppliersForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={data ? toFormValues(data) : undefined}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
