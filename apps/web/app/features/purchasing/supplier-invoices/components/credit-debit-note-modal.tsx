import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import {
  useCreateCreditNoteMutation,
  useCreateDebitNoteMutation,
} from '../hooks/use-supplier-invoices-mutations';
import { useSuppliersAllQuery } from '../hooks/use-supplier-invoices-queries';
import { TabCreditNoteForm } from './tab-credit-note-form';
import { TabDebitNoteForm } from './tab-debit-note-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NoteType = 'CREDIT_NOTE' | 'DEBIT_NOTE';

export function CreditDebitNoteModal({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState<NoteType>('CREDIT_NOTE');

  const { mutate: saveCreditNote, isPending: isSavingCN } = useCreateCreditNoteMutation();
  const { mutate: saveDebitNote, isPending: isSavingDN } = useCreateDebitNoteMutation();

  const isPending = isSavingCN || isSavingDN;
  const { data: suppliers = [] } = useSuppliersAllQuery();

  const handleSuccess = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Nota de Crédito / Débito</DialogTitle>
          <DialogDescription>
            Registra una nota de crédito o débito para ajustar cuentas con proveedores.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NoteType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="CREDIT_NOTE" disabled={isPending}>
              Nota de Crédito
            </TabsTrigger>
            <TabsTrigger value="DEBIT_NOTE" disabled={isPending}>
              Nota de Débito
            </TabsTrigger>
          </TabsList>

          <TabsContent value="CREDIT_NOTE">
            <TabCreditNoteForm
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
              suppliers={suppliers}
              saveMutation={saveCreditNote}
              isSaving={isSavingCN}
            />
          </TabsContent>

          <TabsContent value="DEBIT_NOTE">
            <TabDebitNoteForm
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
              suppliers={suppliers}
              saveMutation={saveDebitNote}
              isSaving={isSavingDN}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
