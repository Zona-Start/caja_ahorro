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
import { SupplierInvoicesViewModal } from './supplier-invoices-view-modal';

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

  const isEditMode = mode === 'edit';

  if (mode === 'view') {
    return (
      <SupplierInvoicesViewModal
        open={isOpen}
        onOpenChange={(o) => { if (!o) closeModal(); }}
        invoiceId={data?.id}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent 
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Editar Factura'
              : 'Nueva Factura de Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información de la factura.'
              : 'Registra una nueva factura de proveedor.'}
          </DialogDescription>
        </DialogHeader>
        <SupplierInvoicesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={data ? toFormValues(data) : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
