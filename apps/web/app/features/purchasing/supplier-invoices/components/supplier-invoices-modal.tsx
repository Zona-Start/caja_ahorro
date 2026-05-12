import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { SupplierInvoiceMutation } from '../schemas/supplier-invoice.schema';
import type { SupplierInvoiceApi } from '../schemas/supplier-invoice-api.schema';
import { useSupplierInvoicesModalStore } from '../store/supplier-invoices-modal.store';
import { SupplierInvoicesForm } from './supplier-invoices-form';

function toFormValues(invoice: SupplierInvoiceApi): Partial<SupplierInvoiceMutation> {
  return Object.fromEntries(
    Object.entries(invoice).map(([key, value]) => [
      key,
      value === null ? undefined : value,
    ]),
  ) as Partial<SupplierInvoiceMutation>;
}

export function SupplierInvoicesModal() {
  const { isOpen, mode, data, closeModal } = useSupplierInvoicesModalStore();

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles de la Factura'
              : isEditMode
                ? 'Editar Factura'
                : 'Nueva Factura de Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa de la factura.'
              : isEditMode
                ? 'Actualiza la información de la factura.'
                : 'Registra una nueva factura de proveedor.'}
          </DialogDescription>
        </DialogHeader>
        <SupplierInvoicesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={data ? toFormValues(data) : undefined}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
