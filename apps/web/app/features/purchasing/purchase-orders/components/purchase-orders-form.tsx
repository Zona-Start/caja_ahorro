import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import { Separator } from '@repo/shadcn/separator';
import { Plus, Trash2, FileText, ListOrdered, Calculator } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { LINE_TYPES } from '../schemas/purchase-orders-options';
import { type PurchaseOrder, purchaseOrderSchema } from '../schemas/purchase-orders.schema';
import { usePurchaseOrderMutation } from '../hooks/use-purchase-orders-mutations';
import { useProductsForOrder, useServicesForOrder, useSuppliersForOrder, usePurchaseOrderDefaults } from '../hooks/use-purchase-orders-queries';

interface PurchaseOrdersFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<PurchaseOrder>;
  readOnly?: boolean;
}

const CURRENCY_OPTIONS = [
  { value: 'VES', label: 'Bolívares (VES)' },
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'EUR', label: 'Euros (EUR)' },
] as const;

const CURRENCY_SYMBOLS: Record<string, string> = { VES: 'Bs.', USD: '$', EUR: '€' };

function todayStr() { return new Date().toISOString().slice(0, 10); }

const emptyItem = {
  lineType: 'SALES_INVENTORY' as const,
  productId: '',
  itemId: '',
  description: '',
  quantity: 1,
  unitCost: 0,
  totalCost: 0,
  taxPercent: 16,
};

export function PurchaseOrdersForm({ onSuccess, onCancel, defaultValues, readOnly = false }: PurchaseOrdersFormProps) {
  const { mutateAsync: saveOrder, isPending } = usePurchaseOrderMutation();
  const { data: products } = useProductsForOrder();
  const { data: services } = useServicesForOrder();
  const { data: suppliers } = useSuppliersForOrder();
  const { data: defaults } = usePurchaseOrderDefaults();
  const { user } = useAuthStore();
  const isEmpresaComercial = user?.memberships?.[0]?.bussinessType === 'EMPRESA_COMERCIAL';
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<PurchaseOrder | null>(null);

  const form = useForm<PurchaseOrder>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      orderDate: todayStr(),
      expectedDeliveryDate: '',
      currencyCode: 'VES',
      purchaseExchangeRate: 1,
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      observations: '',
      items: [emptyItem],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const watchItems = form.watch('items');
  const watchSupplierId = form.watch('supplierId');
  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });
  const purchaseRate = useWatch({ control: form.control, name: 'purchaseExchangeRate' });
  const isForeignCurrency = isEmpresaComercial && currencyCode !== 'VES';

  const defaultTax = defaults?.taxPurchases ?? 16;
  const sym = isEmpresaComercial ? (CURRENCY_SYMBOLS[currencyCode] ?? currencyCode) : 'Bs.';

  useEffect(() => {
    if (!isForeignCurrency) return;
    apiClient.get(`/core/exchange-rates/latest/${currencyCode}`)
      .then((res) => {
        if (res.data?.rate) {
          const rate = parseFloat(res.data.rate);
          if (!isNaN(rate) && rate > 0) {
            form.setValue('purchaseExchangeRate', rate, { shouldDirty: true });
          }
        }
      })
      .catch(() => { });
  }, [currencyCode]);

  useEffect(() => {
    if (defaults && !defaultValues?.id) {
      (watchItems || []).forEach((_, i) => {
        form.setValue(`items.${i}.taxPercent`, defaultTax);
      });
    }
  }, [defaults]);

  const totals = (() => {
    let subtotal = 0;
    let tax = 0;
    const pr = Number(purchaseRate) || 1;
    (watchItems || []).forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unitCost) || 0;
      const lineSub = qty * cost;
      subtotal += lineSub;
      tax += lineSub * (((Number(item.taxPercent) || defaultTax)) / 100);
    });
    return {
      subtotal: +subtotal.toFixed(2),
      taxAmount: +tax.toFixed(2),
      totalAmount: +(subtotal + tax).toFixed(2),
      totalAmountVes: +((subtotal + tax) * pr).toFixed(2),
    };
  })();

  useEffect(() => {
    form.setValue('subtotal', totals.subtotal, { shouldValidate: false });
    form.setValue('taxAmount', totals.taxAmount, { shouldValidate: false });
    form.setValue('totalAmount', totals.totalAmount, { shouldValidate: false });
  }, [totals, form]);


  const onSubmit = async (data: PurchaseOrder) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;
    const items = (pendingData.items || []).map((item) => {
      const { productId, itemId, ...rest } = item;
      return {
        ...rest,
        ...(item.lineType === 'SALES_INVENTORY' ? { productId: productId || undefined } : {}),
        ...(item.lineType !== 'SALES_INVENTORY' && item.lineType !== 'EXPENSE' ? { itemId: itemId || undefined } : {}),
        totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
      };
    });
    const payload = {
      ...pendingData,
      items,
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
    };
    await saveOrder(payload);
    setShowConfirm(false);
    setPendingData(null);
    form.reset();
    onSuccess?.();
  };

  const supplierName = suppliers?.find((s) => s.id === watchSupplierId)?.name ?? '—';
  const currentSupplierTaxId = suppliers?.find((s) => s.id === watchSupplierId)?.taxId ?? '—';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ── 1. ENCABEZADO ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="supplierId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione proveedor" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {suppliers?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {currentSupplierTaxId && (
                <FormItem>
                  <FormLabel>RIF Proveedor</FormLabel>
                  <Input value={currentSupplierTaxId} disabled />
                </FormItem>
              )}
              <FormField control={form.control} name="currencyCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={readOnly || !isEmpresaComercial}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione moneda" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {isEmpresaComercial ? CURRENCY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      )) : (
                        <SelectItem value="VES">Bolívares (VES)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {isForeignCurrency && (
                <FormField control={form.control} name="purchaseExchangeRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de Cambio (Compra)</FormLabel>
                    <FormControl><Input type="text" inputMode="decimal" placeholder="1.00" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="orderDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Orden</FormLabel>
                  <FormControl><Input type="date" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expectedDeliveryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Entrega (opcional)</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="md:col-span-2">
                <FormField control={form.control} name="observations" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl><Textarea placeholder="Observaciones de la orden" className="resize-none" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. ÍTEMS ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <ListOrdered className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Ítems de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {fields.map((f, idx) => {
              const lineType = watchItems?.[idx]?.lineType;
              const itemCount = fields.length;
              const item = watchItems?.[idx];
              const qty = Number(item?.quantity) || 0;
              const cost = Number(item?.unitCost) || 0;
              const lineSub = qty * cost;
              const itemTax = lineSub * (((Number(item?.taxPercent) || defaultTax)) / 100);
              const lineTotal = lineSub + itemTax;

              return (
                <div key={f.id} className="rounded-lg border p-4 space-y-3 relative">
                  {itemCount > 1 && !readOnly && (
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-red-500"
                      onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField control={form.control} name={`items.${idx}.lineType`} render={({ field: fld }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={fld.onChange} value={fld.value} disabled={readOnly}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {LINE_TYPES.map((lt) => (
                              <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {lineType === 'SALES_INVENTORY' && (
                      <FormField control={form.control} name={`items.${idx}.productId`} render={({ field: fld }) => (
                        <FormItem>
                          <FormLabel>Producto</FormLabel>
                          <Select onValueChange={(val) => {
                            fld.onChange(val);
                            form.setValue(`items.${idx}.itemId` as any, undefined);
                          }} value={fld.value ?? ''} disabled={readOnly}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {products?.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {(lineType === 'SERVICE' || lineType === 'SERVICE_EXPENSE') && (
                      <FormField control={form.control} name={`items.${idx}.itemId`} render={({ field: fld }) => (
                        <FormItem>
                          <FormLabel>Servicio</FormLabel>
                          <Select onValueChange={fld.onChange} value={fld.value ?? ''} disabled={readOnly}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {services?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {(lineType === 'EXPENSE' || lineType === 'FIXED_ASSET') && (
                      <FormField control={form.control} name={`items.${idx}.description`} render={({ field: fld }) => (
                        <FormItem>
                          <FormLabel>{lineType === 'FIXED_ASSET' ? 'Activo Fijo' : 'Descripción'}</FormLabel>
                          <FormControl><Input placeholder={lineType === 'FIXED_ASSET' ? 'Nombre del activo fijo' : 'Descripción del gasto'} {...fld} value={fld.value ?? ''} disabled={readOnly} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <FormField control={form.control} name={`items.${idx}.quantity`} render={({ field: fld }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl><Input type="text" inputMode="numeric" placeholder="0" {...fld} disabled={readOnly}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '');
                            fld.onChange(v ? Number(v) : 0);
                          }}
                          value={fld.value ?? ''}
                        /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${idx}.unitCost`} render={({ field: fld }) => (
                      <FormItem>
                        <FormLabel>Costo Unitario ({sym})</FormLabel>
                        <FormControl><Input type="text" inputMode="decimal" placeholder="0.00" {...fld} disabled={readOnly}
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = v.split('.');
                            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                            fld.onChange(v ? Number(v) : 0);
                          }}
                          value={fld.value ?? ''}
                        /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${idx}.taxPercent`} render={({ field: fld }) => (
                      <FormItem>
                        <FormLabel>IVA %</FormLabel>
                        <FormControl><Input type="text" inputMode="decimal" placeholder={String(defaultTax)} {...fld} disabled={readOnly}
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = v.split('.');
                            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                            fld.onChange(v ? Number(v) : 0);
                          }}
                          value={fld.value ?? ''}
                        /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Costo Total</p>
                      <div className="text-sm pt-2 space-y-0.5">
                        <div className="flex justify-between"><span className="text-muted-foreground">Sub:</span><span>{sym} {lineSub.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">IVA:</span><span>{sym} {itemTax.toFixed(2)}</span></div>
                        <Separator className="my-0.5" />
                        <div className="flex justify-between font-medium"><span>Total:</span><span>{sym} {lineTotal.toFixed(2)}</span></div>
                        {isForeignCurrency && (
                          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                            <span>Total VES:</span><span>Bs. {(lineTotal * (Number(purchaseRate) || 1)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem, taxPercent: defaultTax })}>
                <Plus className="h-4 w-4 mr-1" /> Agregar Ítem
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── 3. RESUMEN ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <Calculator className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (sin IVA):</span><span className="font-medium">{sym} {totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Impuesto (IVA):</span><span className="font-medium">{sym} {totals.taxAmount.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between text-base"><span className="font-semibold">Total:</span><span className="font-bold">{sym} {totals.totalAmount.toFixed(2)}</span></div>
              {isForeignCurrency && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total en VES (tasa {Number(purchaseRate) || 1}):</span>
                  <span>Bs. {totals.totalAmountVes.toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── BOTONES ── */}
        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : (defaultValues?.id ? 'Actualizar Orden' : 'Crear Orden')}
            </Button>
          )}
        </div>
      </form>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Orden de Compra</DialogTitle>
            <DialogDescription>
              Revise los datos antes de crear la orden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm py-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Proveedor:</span>
              <span className="font-medium">{supplierName}</span>
              <span className="text-muted-foreground">RIF:</span>
              <span className="font-medium">{currentSupplierTaxId}</span>
              <span className="text-muted-foreground">Moneda:</span>
              <span className="font-medium">{currencyCode}</span>
              {isForeignCurrency && (
                <>
                  <span className="text-muted-foreground">Tasa:</span>
                  <span className="font-medium">{Number(purchaseRate) || 1}</span>
                </>
              )}
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">{pendingData?.orderDate?.toString().slice(0, 10) ?? '—'}</span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground font-medium">Ítems ({pendingData?.items?.length || 0})</p>
            <div className="max-h-[140px] overflow-y-auto space-y-1">
              {(pendingData?.items || []).map((item: any, i: number) => {
                const itemName = item.productId
                  ? (products?.find((p) => p.id === item.productId)?.name || `Ítem ${i + 1}`)
                  : item.itemId
                    ? (services?.find((s) => s.id === item.itemId)?.name || item.description || `Ítem ${i + 1}`)
                    : (item.description || `Ítem ${i + 1}`);
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
                return (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="truncate max-w-[280px]">{itemName} × {item.quantity || 0}</span>
                    <span className="font-mono">{sym} {lineTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <Separator />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-mono">{sym} {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA:</span>
                <span className="font-mono">{sym} {totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total:</span>
                <span className="font-mono">{sym} {totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowConfirm(false); setPendingData(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Confirmar y Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
