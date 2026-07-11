import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import {
  useSaveSupplierInvoiceMutation,
  useCreateCreditNoteMutation,
  useCreateDebitNoteMutation,
} from '../hooks/use-supplier-invoices-mutations';
import {
  useSuppliersAllQuery,
  useProductsAllQuery,
  useServicesAllQuery,
} from '../hooks/use-supplier-invoices-queries';
import {
  type SupplierInvoiceMutation,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from '../schemas/supplier-invoice.schema';
import { TabInvoiceForm } from './tab-invoice-form';
import { TabCreditNoteForm } from './tab-credit-note-form';
import { TabDebitNoteForm } from './tab-debit-note-form';

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
  const [activeTab, setActiveTab] = useState<DocumentType>('INVOICE');

  const { mutate: saveInvoice, isPending: isSavingInvoice } = useSaveSupplierInvoiceMutation();
  const { mutate: saveCreditNote, isPending: isSavingCN } = useCreateCreditNoteMutation();
  const { mutate: saveDebitNote, isPending: isSavingDN } = useCreateDebitNoteMutation();

  const isPending = isSavingInvoice || isSavingCN || isSavingDN;

  const { data: suppliers = [] } = useSuppliersAllQuery();

  const handleSuccess = () => onSuccess?.();

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentType)}>
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
            <TabsTrigger key={key} value={key} disabled={isPending}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="INVOICE">
          <TabInvoiceForm
            defaultValues={defaultValues}
            onSuccess={handleSuccess}
            onCancel={onCancel}
            disabled={disabled || isPending}
          />
        </TabsContent>

        <TabsContent value="CREDIT_NOTE">
          <TabCreditNoteForm
            onSuccess={handleSuccess}
            onCancel={onCancel}
            suppliers={suppliers}
            saveMutation={saveCreditNote}
            isSaving={isSavingCN}
          />
        </TabsContent>

        <TabsContent value="DEBIT_NOTE">
          <TabDebitNoteForm
            onSuccess={handleSuccess}
            onCancel={onCancel}
            suppliers={suppliers}
            saveMutation={saveDebitNote}
            isSaving={isSavingDN}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
