import { useEffect, useState } from 'react';
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
import { SuppliersViewModal } from './suppliers-view-modal';

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
  const [viewOpen, setViewOpen] = useState(false);

  const handleSuccess = () => {
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  const isViewMode = mode === 'view';

  useEffect(() => {
    if (isOpen && isViewMode) {
      setViewOpen(true);
    }
  }, [isOpen, isViewMode]);

  const handleViewOpenChange = (open: boolean) => {
    setViewOpen(open);
    if (!open) closeModal();
  };

  if (isViewMode) {
    return (
      <SuppliersViewModal
        open={viewOpen}
        onOpenChange={handleViewOpenChange}
        data={data}
      />
    );
  }

  const isEditMode = mode === 'edit';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información del proveedor.'
              : 'Crea un nuevo proveedor en el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <SuppliersForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={data ? toFormValues(data) : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
