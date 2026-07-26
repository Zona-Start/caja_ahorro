import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAccountsPayableBySupplierQuery } from '../hooks/use-supplier-invoices-queries';
import { debitNoteFormSchema, type DebitNoteForm } from '../schemas/supplier-invoice.schema';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  suppliers: { id: string; name: string }[];
  saveMutation: (data: DebitNoteForm, opts: { onSuccess: () => void }) => void;
  isSaving: boolean;
}

export function TabDebitNoteForm({ onSuccess, onCancel, suppliers, saveMutation, isSaving }: Props) {
  const form = useForm<DebitNoteForm>({
    resolver: zodResolver(debitNoteFormSchema),
    defaultValues: {
      documentType: 'DEBIT_NOTE',
      supplierId: '',
      debitNoteNumber: '',
      reason: '',
      amount: 0,
      taxAmount: 0,
      notesDate: new Date(),
      observations: '',
      accountsPayableId: null,
    },
  });

  const supplierId = useWatch({ control: form.control, name: 'supplierId' });
  const watchedAmount = useWatch({ control: form.control, name: 'amount' });
  const { data: supplierCxPs = [] } = useAccountsPayableBySupplierQuery(supplierId || null);

  // ── IVA desde tenantSettings ──
  const { data: taxDefaults } = useQuery({
    queryKey: ['tenant-settings', 'TAX_PURCHASES'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/core/tenants-settings?key=TAX_PURCHASES&limit=1');
        const setting = res.data?.data?.[0] ?? res.data;
        return Number(setting?.value || setting?.[0]?.value) || 16;
      } catch { return 16; }
    },
    staleTime: 5 * 60 * 1000,
  });
  const defaultTaxPercent = taxDefaults ?? 16;
  const [taxPercent, setTaxPercent] = useState(defaultTaxPercent);

  useEffect(() => { setTaxPercent(defaultTaxPercent); }, [defaultTaxPercent]);

  const baseAmount = Number(watchedAmount) || 0;
  const taxAmount = +(baseAmount * (taxPercent / 100)).toFixed(2);
  const total = +(baseAmount + taxAmount).toFixed(2);

  // Sync taxAmount al form
  useEffect(() => {
    form.setValue('taxAmount', taxAmount, { shouldValidate: false });
  }, [taxAmount, form]);

  const onSubmit = (data: DebitNoteForm) => {
    saveMutation(data, { onSuccess: () => onSuccess?.() });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="supplierId" render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger></FormControl>
                <SelectContent>{suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="accountsPayableId" render={({ field }) => (
            <FormItem>
              <FormLabel>CxP asociada (opcional)</FormLabel>
              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar CxP" /></SelectTrigger></FormControl>
                <SelectContent>{supplierCxPs.map((cxp: any) => (
                  <SelectItem key={cxp.id} value={cxp.id}>
                    {cxp.accountsPayableNumber || cxp.invoiceNumber || cxp.id} - {cxp.status || 'N/A'}
                  </SelectItem>
                ))}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="notesDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl><Input type="date" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Monto (sin IVA)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* ── RESUMEN ── */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Monto (sin IVA):</span><span className="font-medium">Bs. {baseAmount.toFixed(2)}</span></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">IVA</span>
              <Input type="text" inputMode="decimal" className="w-16 h-7 text-xs text-center" value={taxPercent}
                onChange={(e) => { let v = e.target.value.replace(/[^0-9.]/g, ''); const parts = v.split('.'); if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join(''); setTaxPercent(Math.min(v ? Number(v) : 0, 100)); }} />
              <span className="text-muted-foreground">%</span>
            </div>
            <span className="font-medium text-right">Bs. {taxAmount.toFixed(2)}</span>
          </div>
          <hr className="my-0.5 border-border" />
          <div className="flex justify-between text-base"><span className="font-semibold">Total:</span><span className="font-bold">Bs. {total.toFixed(2)}</span></div>
        </div>

        <FormField control={form.control} name="reason" render={({ field }) => (
          <FormItem>
            <FormLabel>Motivo</FormLabel>
            <FormControl><Textarea placeholder="Motivo de la nota de débito" {...field} rows={2} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="observations" render={({ field }) => (
          <FormItem>
            <FormLabel>Observaciones</FormLabel>
            <FormControl><Textarea placeholder="Observaciones adicionales" {...field} value={field.value ?? ''} rows={2} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Nota de Débito'}</Button>
        </div>
      </form>
    </Form>
  );
}
