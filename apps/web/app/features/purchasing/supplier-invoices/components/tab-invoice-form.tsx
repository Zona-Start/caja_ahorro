import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useSaveSupplierInvoiceMutation } from '../hooks/use-supplier-invoices-mutations';
import {
  useSuppliersAllQuery,
  usePurchaseOrdersForInvoiceQuery,
  useProductsAllQuery,
  useServicesAllQuery,
} from '../hooks/use-supplier-invoices-queries';
import {
  supplierInvoiceFormSchema,
  type SupplierInvoiceForm,
  type SupplierInvoiceMutation,
} from '../schemas/supplier-invoice.schema';
import {
  PAYMENT_TYPE_LABELS,
  LINE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../schemas/supplier-invoice-options';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';

function toFormValues(data: Partial<SupplierInvoiceMutation>): SupplierInvoiceForm {
  return {
    documentType: 'INVOICE',
    supplierId: data.supplierId ?? '',
    purchaseOrderId: data.purchaseOrderId ?? null,
    invoiceNumber: data.invoiceNumber ?? '',
    controlNumber: data.controlNumber ?? '',
    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    subtotal: data.subtotal ?? 0,
    taxAmount: data.taxAmount ?? 0,
    totalAmount: data.totalAmount ?? 0,
    paymentType: data.paymentType ?? 'CREDIT',
    status: data.status ?? 'DRAFT',
    observations: data.observations ?? '',
    currencyCode: data.currencyCode ?? 'VES',
    paymentMethod: data.paymentMethod ?? undefined,
    bankAccountId: data.bankAccountId ?? null,
    bankReference: data.bankReference ?? '',
    items: (data.items?.length
      ? data.items.map((item) => ({
        lineType: item.lineType ?? 'SALES_INVENTORY',
        itemId: item.itemId ?? null,
        expenseAccountId: item.expenseAccountId ?? null,
        description: item.description ?? '',
        quantity: item.quantity ?? 1,
        unitCost: item.unitCost ?? 0,
        totalLine: item.totalLine ?? 0,
      }))
      : []),
  };
}

interface Props {
  defaultValues?: Partial<SupplierInvoiceMutation>;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function TabInvoiceForm({ defaultValues, onSuccess, onCancel, disabled = false }: Props) {
  const formDefaults = toFormValues(defaultValues ?? {});

  const form = useForm<SupplierInvoiceForm>({
    resolver: zodResolver(supplierInvoiceFormSchema),
    defaultValues: formDefaults,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const watchedSupplierId = useWatch({ control: form.control, name: 'supplierId' });
  const watchedPurchaseOrderId = useWatch({ control: form.control, name: 'purchaseOrderId' });
  const watchedPaymentType = useWatch({ control: form.control, name: 'paymentType' });
  const watchItems = form.watch('items');

  const { mutate: saveInvoice, isPending: isSaving } = useSaveSupplierInvoiceMutation();
  const { data: suppliers = [] } = useSuppliersAllQuery();
  const { data: purchaseOrders = [] } = usePurchaseOrdersForInvoiceQuery(watchedSupplierId);
  const { data: products = [] } = useProductsAllQuery();
  const { data: services = [] } = useServicesAllQuery();
  const { data: bankAccountsData } = useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];

  // ── IVA por defecto desde tenantSettings ──
  const { data: taxDefaults } = useQuery({
    queryKey: ['tenant-settings', 'TAX_PURCHASES'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/core/tenants-settings?key=TAX_PURCHASES&limit=1');
        const setting = res.data?.data?.[0] ?? res.data;
        return Number(setting?.value || setting?.[0]?.value) || 16;
      } catch {
        return 16;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
  const defaultTaxPercent = taxDefaults ?? 16;

  // ── IVA: porcentaje editable, monto calculado ──
  const [taxPercent, setTaxPercent] = useState(defaultTaxPercent);

  // ── Precargar ítems desde OC ──
  const { data: selectedPO } = useQuery({
    queryKey: ['purchase-order', watchedPurchaseOrderId],
    queryFn: async () => {
      if (!watchedPurchaseOrderId) return null;
      const res = await apiClient.get(`/administration/purchase-orders/${watchedPurchaseOrderId}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!watchedPurchaseOrderId,
  });

  useEffect(() => {
    if (selectedPO?.items?.length) {
      form.setValue('items', selectedPO.items.map((item: any) => {
        const prod = (item.lineType === 'SALES_INVENTORY' || item.lineType === 'PRODUCT')
          ? products.find((p: any) => p.id === String(item.itemId))
          : null;
        const svc = item.lineType === 'SERVICE'
          ? services.find((s: any) => s.id === String(item.itemId))
          : null;
        const name = prod?.name || svc?.name || item.itemName || item.description || '';
        return {
          lineType: item.lineType ?? 'PRODUCT',
          itemId: item.itemId ?? null,
          expenseAccountId: null,
          description: name,
          quantity: Number(item.quantity) || 1,
          unitCost: Number(item.unitCost) || 0,
          totalLine: Number(item.totalCost) || (Number(item.quantity) || 1) * (Number(item.unitCost) || 0),
        };
      }));
    }
  }, [selectedPO?.id, products, services]);

  // ── Totales en tiempo real ──
  const totals = (() => {
    let subtotal = 0;
    (watchItems || []).forEach((item: any) => {
      subtotal += (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
    });
    const taxAmount = +(subtotal * (taxPercent / 100)).toFixed(2);
    return {
      subtotal: +subtotal.toFixed(2),
      taxAmount: taxAmount,
      totalAmount: +(subtotal + taxAmount).toFixed(2),
    };
  })();

  // Sync IVA amount to form
  useEffect(() => {
    form.setValue('taxAmount', totals.taxAmount, { shouldValidate: false });
  }, [totals.taxAmount, form]);

  useEffect(() => {
    form.setValue('subtotal', totals.subtotal, { shouldValidate: false });
    form.setValue('totalAmount', totals.totalAmount, { shouldValidate: false });
  }, [totals, form]);

  // Sync percent when defaults load
  useEffect(() => {
    setTaxPercent(defaultTaxPercent);
  }, [defaultTaxPercent]);

  const onSubmit = (data: SupplierInvoiceForm) => {
    saveInvoice(data, { onSuccess: () => onSuccess?.() });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="supplierId" render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select disabled={disabled} value={field.value ?? ''} onValueChange={(v) => { field.onChange(v); form.setValue('purchaseOrderId', null); }}>
                <FormControl><SelectTrigger className='w-full'><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger></FormControl>
                <SelectContent>{suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="purchaseOrderId" render={({ field }) => (
            <FormItem>
              <FormLabel>Orden de Compra (opcional)</FormLabel>
              <Select disabled={disabled || !watchedSupplierId} value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                <FormControl><SelectTrigger className='w-full'><SelectValue placeholder="Sin orden de compra" /></SelectTrigger></FormControl>
                <SelectContent>{purchaseOrders.map((po) => (<SelectItem key={po.id} value={po.id}>{po.orderNumber}</SelectItem>))}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Factura</FormLabel>
              <FormControl><Input placeholder="N° factura" {...field} disabled={disabled} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="controlNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Control</FormLabel>
              <FormControl><Input placeholder="N° control" {...field} value={field.value ?? ''} disabled={disabled} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="invoiceDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Factura</FormLabel>
              <FormControl>
                <Input type="date" disabled={disabled}
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />



          <FormField control={form.control} name="paymentType" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Pago</FormLabel>
              <Select disabled={disabled} value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger className='w-full'><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger></FormControl>
                <SelectContent>{Object.entries(PAYMENT_TYPE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {watchedPaymentType === 'CREDIT' && (
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled}
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        {/* ── CONTADO ── */}
        {watchedPaymentType === 'CASH' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
            <FormField control={form.control} name="currencyCode" render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda <span className="text-red-500">*</span></FormLabel>
                <Select disabled={disabled} value={field.value ?? 'VES'} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="VES">Bolívares (VES)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                    <SelectItem value="EUR">Euros (EUR)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago <span className="text-red-500">*</span></FormLabel>
                <Select disabled={disabled} value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger></FormControl>
                  <SelectContent>{Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="bankAccountId" render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta Bancaria / Caja <span className="text-red-500">*</span></FormLabel>
                <Select disabled={disabled} value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cuenta" /></SelectTrigger></FormControl>
                  <SelectContent>{bankAccounts.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.accountName} - {a.accountNumber?.slice(-4)}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="bankReference" render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia Bancaria</FormLabel>
                <FormControl><Input placeholder="N° referencia" {...field} value={field.value ?? ''} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {/* ── ÍTEMS ── */}
        <div className="border-t pt-4 mt-4 space-y-4">
          <h4 className="text-sm font-medium">Agregar Ítem</h4>
          {!disabled && (
            <ItemComposer
              products={products}
              services={services}
              onAdd={(item) => {
                append(item);
              }}
            />
          )}

          {/* ── Tabla de ítems agregados ── */}
          {fields.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium">#</th>
                    <th className="text-left px-3 py-2 text-xs font-medium">Tipo</th>
                    <th className="text-left px-3 py-2 text-xs font-medium">Descripción</th>
                    <th className="text-center px-2 py-2 text-xs font-medium">Unidad</th>
                    <th className="text-right px-3 py-2 text-xs font-medium">Cant</th>
                    <th className="text-right px-3 py-2 text-xs font-medium">Costo Unit</th>
                    <th className="text-right px-3 py-2 text-xs font-medium">Total</th>
                    {!disabled && <th className="w-10 px-2 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f, idx) => {
                    const item = watchItems?.[idx];
                    const desc = item?.description || '—';
                    const qty = Number(item?.quantity) || 0;
                    const cost = Number(item?.unitCost) || 0;
                    const total = qty * cost;
                    const typeLabel = LINE_TYPE_LABELS[item?.lineType as keyof typeof LINE_TYPE_LABELS] || item?.lineType || '—';
                    const isProduct = item?.lineType === 'SALES_INVENTORY';
                    const product = isProduct ? products.find((p) => p.id === item?.itemId) : null;
                    const itemUnit = (item as any)?.unitOfMeasure;
                    const unitLabel = itemUnit
                      ? (UNIT_MEASURES.find((u) => u.value === itemUnit)?.label || itemUnit)
                      : (product?.unitOfMeasure
                        ? (UNIT_MEASURES.find((u) => u.value === product.unitOfMeasure)?.label || product.unitOfMeasure)
                        : '—');
                    return (
                      <tr key={f.id} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2">{typeLabel}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">{desc}</td>
                        <td className="px-2 py-2 text-center text-muted-foreground">{unitLabel}</td>
                        <td className="px-3 py-2 text-right">{qty}</td>
                        <td className="px-3 py-2 text-right font-mono">Bs. {cost.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono font-medium">Bs. {total.toFixed(2)}</td>
                        {!disabled && (
                          <td className="px-2 py-2">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── RESUMEN ── */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (sin IVA):</span><span className="font-medium">Bs. {totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">IVA</span>
              <Input
                type="text"
                inputMode="decimal"
                className="w-16 h-7 text-xs text-center"
                value={taxPercent}
                disabled={disabled}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = v.split('.');
                  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                  const num = v ? Number(v) : 0;
                  setTaxPercent(Math.min(num, 100));
                }}
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span className="font-medium text-right">Bs. {totals.taxAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base"><span className="font-semibold">Total:</span><span className="font-bold">Bs. {totals.totalAmount.toFixed(2)}</span></div>
        </div>

        <FormField control={form.control} name="observations" render={({ field }) => (
          <FormItem>
            <FormLabel>Observaciones</FormLabel>
            <FormControl><Textarea placeholder="Observaciones de la factura" {...field} value={field.value ?? ''} disabled={disabled} rows={3} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-4 pt-4">
          {disabled ? (
            <Button type="button" onClick={onCancel}>Cerrar</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Factura'}</Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}

// ── Unidades de medida ──
const UNIT_MEASURES = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'LITER', label: 'Litro' },
  { value: 'METER', label: 'Metro' },
  { value: 'PACK', label: 'Paquete' },
  { value: 'BOX', label: 'Caja' },
] as const;

// ── COMPOSER de ítem (formulario estático + botón Agregar) ──
function ItemComposer({
  products,
  services,
  onAdd,
}: {
  products: { id: string; name: string; unitOfMeasure?: string | null; sku?: string | null }[];
  services: { id: string; name: string }[];
  onAdd: (item: any) => void;
}) {
  const [lineType, setLineType] = useState('SALES_INVENTORY');
  const [itemId, setItemId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [costRaw, setCostRaw] = useState('');
  const [unit, setUnit] = useState('UNIT');

  const resetForm = () => {
    setLineType('SALES_INVENTORY');
    setItemId(null);
    setDescription('');
    setQuantity('1');
    setCostRaw('');
    setUnit('UNIT');
  };

  const handleAdd = () => {
    const qty = parseInt(quantity, 10) || 0;
    const digits = costRaw.replace(/\D/g, '');
    const cost = parseInt(digits || '0', 10) / 100;
    if (qty <= 0) return;

    const productName = itemId ? products.find((p) => p.id === itemId)?.name : '';
    const serviceName = itemId ? services.find((s) => s.id === itemId)?.name : '';
    const name = productName || serviceName || description;
    if (!name) return;

    onAdd({
      lineType,
      itemId,
      expenseAccountId: null,
      description: name,
      quantity: qty,
      unitCost: cost,
      totalLine: qty * cost,
      unitOfMeasure: lineType === 'SALES_INVENTORY' ? unit : null,
    });
    resetForm();
  };

  const showProductSelect = lineType === 'SALES_INVENTORY';
  const showServiceSelect = lineType === 'SERVICE';
  const showDescription = lineType === 'EXPENSE';
  const costDisplay = costRaw
    ? (parseInt(costRaw.replace(/\D/g, '') || '0', 10) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border rounded-lg p-3 bg-muted/30">
      <div className="space-y-1">
        <label className="text-xs font-medium">Tipo</label>
        <Select value={lineType} onValueChange={(v) => { setLineType(v); setItemId(null); setDescription(''); }}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(LINE_TYPE_LABELS).map(([k, l]) => (<SelectItem key={k} value={k}>{l}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {showProductSelect && (
        <div className="space-y-1">
          <label className="text-xs font-medium">Producto</label>
          <Select value={itemId ?? ''} onValueChange={(v) => { setItemId(v || null); const p = products.find((x) => x.id === v); if (p) { setDescription(p.name); if (p.unitOfMeasure) setUnit(p.unitOfMeasure); } }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccione" /></SelectTrigger>
            <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      )}

      {showProductSelect && (
        <div className="space-y-1 ml-4 ">
          <label className="text-xs font-medium">Unidad</label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{UNIT_MEASURES.map((u) => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      )}

      {showServiceSelect && (
        <div className="space-y-1">
          <label className="text-xs font-medium">Servicio</label>
          <Select value={itemId ?? ''} onValueChange={(v) => { setItemId(v || null); const s = services.find((x) => x.id === v); if (s) setDescription(s.name); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccione" /></SelectTrigger>
            <SelectContent>{services.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      )}

      {showDescription && (
        <div className="space-y-1">
          <label className="text-xs font-medium">Descripción</label>
          <Input className="h-9 text-xs" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium">Cantidad</label>
        <Input className="h-9 text-xs" inputMode="numeric" placeholder="1" value={quantity}
          onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setQuantity(v); }} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Costo Unit</label>
        <Input className="h-9 text-xs" inputMode="decimal" placeholder="0,00"
          value={costDisplay}
          onChange={(e) => { setCostRaw(e.target.value.replace(/\D/g, '')); }}
          onFocus={(e) => e.target.select()} />
      </div>

      <div className="flex items-end">
        <Button type="button" size="sm" className="h-9" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" /> Agregar
        </Button>
      </div>
    </div>
  );
}

// ── Separator ──
function Separator() { return <hr className="my-0.5 border-border" />; }
