import { useSaveSupplierInvoiceMutation } from '../hooks/use-supplier-invoices-mutations';
import type { SupplierInvoiceMutation } from '../schemas/supplier-invoice.schema';
import { TabInvoiceForm } from './tab-invoice-form';

interface SupplierInvoicesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierInvoiceMutation>;
  disabled?: boolean;
}

export function SupplierInvoicesForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: SupplierInvoicesFormProps) {
  const { mutate: saveInvoice, isPending } = useSaveSupplierInvoiceMutation();

  return (
    <TabInvoiceForm
      defaultValues={defaultValues}
      onSuccess={onSuccess}
      onCancel={onCancel}
      disabled={disabled || isPending}
    />
  );
}
