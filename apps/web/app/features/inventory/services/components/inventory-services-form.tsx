import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import { Badge } from '@repo/shadcn/badge';
import { Separator } from '@repo/shadcn/separator';
import { Plus, Trash2, Settings, DollarSign, Truck } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { useCategoriesQuery } from '../hooks/use-inventory-services-queries';
import { useInventoryServiceMutation } from '../hooks/use-inventory-services-mutations';
import { type InventoryService, inventoryServiceSchema } from '../schemas/inventory-services.schema';
import { InventoryServiceStatus, INVENTORY_SERVICE_STATUS_OPTIONS, SERVICE_TYPE_OPTIONS } from '../schemas/inventory-services-options';
import type { Supplier } from '@/features/purchasing/suppliers/schemas/suppliers.schema';

interface InventoryServiceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<InventoryService>;
  disabled?: boolean;
}

const CURRENCY_OPTIONS = [
  { value: 'VES', label: 'Bolívares (VES)' },
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'EUR', label: 'Euros (EUR)' },
] as const;

const CURRENCY_SYMBOLS: Record<string, string> = { VES: 'Bs.', USD: '$', EUR: '€' };

function toFormValues(data: Partial<InventoryService> | undefined): Partial<InventoryService> {
  if (!data) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = value === null ? undefined : value;
  }
  if (sanitized.supplierCost != null) sanitized.supplierCost = Math.round(Number(sanitized.supplierCost) * 100) / 100;
  if (sanitized.otherCosts != null) sanitized.otherCosts = Math.round(Number(sanitized.otherCosts) * 100) / 100;
  if (sanitized.purchaseTax != null) sanitized.purchaseTax = Math.round(Number(sanitized.purchaseTax) * 100) / 100;
  return sanitized as Partial<InventoryService>;
}

interface ServiceSupplier {
  suppliersId: string;
  leadTimeDays: number;
  name: string;
}

export function InventoryServiceForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: InventoryServiceFormProps) {
  const { mutateAsync: saveService, isPending: isSaving } = useInventoryServiceMutation();
  const { data: categories } = useCategoriesQuery();
  const { user } = useAuthStore();
  const isEmpresaComercial = user?.memberships?.[0]?.bussinessType === 'EMPRESA_COMERCIAL';
  const readOnly = disabled;

  const [suppliers, setSuppliers] = useState<ServiceSupplier[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [newLeadTime, setNewLeadTime] = useState(0);

  const { data: activeSuppliers } = useQuery<Supplier[]>({
    queryKey: ['active-suppliers-services'],
    queryFn: async () => {
      const res = await apiClient.get('/purchasing/suppliers/all');
      return (res.data?.data ?? res.data ?? []).filter((s: Supplier) => s.status === 'ACTIVE');
    },
  });

  const form = useForm<InventoryService>({
    resolver: zodResolver(inventoryServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      serviceType: '',
      currencyCode: 'VES',
      purchaseExchangeRate: 1,
      supplierCost: 0,
      otherCosts: 0,
      purchaseTax: 16,
      status: InventoryServiceStatus.ACTIVE,
      ...toFormValues(defaultValues),
    },
  });

  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });
  const supplierCost = useWatch({ control: form.control, name: 'supplierCost' });
  const otherCosts = useWatch({ control: form.control, name: 'otherCosts' });
  const purchaseTax = useWatch({ control: form.control, name: 'purchaseTax' });
  const purchaseRate = useWatch({ control: form.control, name: 'purchaseExchangeRate' });
  const isForeignCurrency = isEmpresaComercial && currencyCode !== 'VES';
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
    if (defaultValues?.id) {
      apiClient.get(`/inventory/product-service-suppliers?serviceId=${defaultValues.id}`)
        .then((res) => {
          const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
          setSuppliers(items.map((s: any) => ({
            suppliersId: s.suppliersId ?? s.supplier?.id,
            leadTimeDays: s.leadTimeDays ?? 0,
            name: s.supplier?.name ?? s.supplierName ?? '',
          })));
        })
        .catch(() => { });
    }
  }, [defaultValues?.id]);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      form.reset({
        name: '', description: '', categoryId: '', serviceType: '',
        currencyCode: 'VES', purchaseExchangeRate: 1,
        supplierCost: 0, otherCosts: 0, purchaseTax: 16,
        status: InventoryServiceStatus.ACTIVE,
        ...toFormValues(defaultValues),
      });
    }
  }, [defaultValues]);

  const costCalc = useMemo(() => {
    const base = Number(supplierCost) || 0;
    const other = Number(otherCosts) || 0;
    const taxPct = Number(purchaseTax) || 0;
    const pRate = Number(purchaseRate) || 1;
    const taxAmount = (base + other) * (taxPct / 100);
    const total = base + other + taxAmount;
    return {
      baseCost: base,
      otherCosts: other,
      taxAmount: +taxAmount.toFixed(2),
      totalCost: +total.toFixed(2),
      totalCostVes: +(total * pRate).toFixed(2),
    };
  }, [supplierCost, otherCosts, purchaseTax, purchaseRate]);

  const addSupplier = () => {
    if (!newSupplierId) return;
    const supplier = activeSuppliers?.find((s) => s.id === newSupplierId);
    setSuppliers((prev) => [
      ...prev,
      { suppliersId: newSupplierId, leadTimeDays: newLeadTime, name: supplier?.name ?? '' },
    ]);
    setNewSupplierId('');
    setNewLeadTime(0);
    setShowSupplierForm(false);
  };

  const removeSupplier = (idx: number) => {
    setSuppliers((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: InventoryService) => {
    const payload = {
      ...data,
      currencyCode: currencyCode || 'VES',
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      _suppliers: suppliers.map((s) => ({ suppliersId: s.suppliersId, leadTimeDays: s.leadTimeDays })),
    };
    saveService(payload as any, {
      onSuccess: () => { form.reset(); onSuccess?.(); },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── 1. INFORMACIÓN BÁSICA ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <Settings className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Información del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Nombre del servicio" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione categoría" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {!isEmpresaComercial && (
                <FormField control={form.control} name="serviceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={readOnly}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {SERVICE_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              {isEmpresaComercial && (
                <FormField control={form.control} name="currencyCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda de Operación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione moneda" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(INVENTORY_SERVICE_STATUS_OPTIONS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl><Textarea placeholder="Descripción del servicio" className="resize-none" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── 2. COSTOS ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Costos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="supplierCost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo del Proveedor ({sym})</FormLabel>
                  <FormControl><Input type="text" inputMode="decimal" placeholder="0.00" {...field} value={field.value ?? ''} disabled={readOnly}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = v.split('.');
                      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                      field.onChange(v ? Number(v) : 0);
                    }}
                  /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="otherCosts" render={({ field }) => (
                <FormItem>
                  <FormLabel>Otros Costos ({sym})</FormLabel>
                  <FormControl><Input type="text" inputMode="decimal" placeholder="0.00" {...field} value={field.value ?? ''} disabled={readOnly}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = v.split('.');
                      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                      field.onChange(v ? Number(v) : 0);
                    }}
                  /></FormControl>
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
              <FormField control={form.control} name="purchaseTax" render={({ field }) => (
                <FormItem>
                  <FormLabel>Impuesto (%)</FormLabel>
                  <FormControl><Input type="text" inputMode="decimal" placeholder="16.00" {...field} value={field.value ?? ''} disabled={readOnly}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = v.split('.');
                      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                      field.onChange(v ? Number(v) : 0);
                    }}
                  /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {Number(supplierCost) > 0 && (
              <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                <p className="font-medium text-muted-foreground mb-1">Resumen de Costos</p>
                <div className="flex justify-between"><span>Costo Base:</span><span>{sym} {costCalc.baseCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Otros Costos:</span><span>{sym} {costCalc.otherCosts.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>IVA de Compra ({purchaseTax}%):</span><span>{sym} {costCalc.taxAmount.toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Costo Total:</span><span>{sym} {costCalc.totalCost.toFixed(2)}</span></div>
                {isForeignCurrency && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Costo Total en VES:</span><span>Bs. {costCalc.totalCostVes.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 3. PROVEEDORES ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <Truck className="h-5 w-5 text-sky-600" />
            <CardTitle className="text-base">Proveedores</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {suppliers.length > 0 && (
              <div className="space-y-2">
                {suppliers.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.name || s.suppliersId.slice(0, 8)}</Badge>
                      <span className="text-muted-foreground">{s.leadTimeDays} días de recepción</span>
                    </div>
                    {!readOnly && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeSupplier(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!readOnly && !showSupplierForm && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSupplierForm(true)}>
                <Plus className="h-4 w-4 mr-1" /> Anexar Proveedor
              </Button>
            )}

            {!readOnly && showSupplierForm && (
              <div className="flex items-end gap-3 rounded-md border p-3">
                <div className="flex-1">
                  <FormLabel className="text-xs">Proveedor</FormLabel>
                  <Select value={newSupplierId} onValueChange={setNewSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Seleccione proveedor" /></SelectTrigger>
                    <SelectContent>
                      {activeSuppliers?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <FormLabel className="text-xs">Días de Recepción</FormLabel>
                  <Input type="number" min={0} value={newLeadTime} onChange={(e) => setNewLeadTime(Number(e.target.value))} placeholder="0" />
                </div>
                <Button type="button" size="sm" onClick={addSupplier}>Agregar</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowSupplierForm(false)}>Cancelar</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── BOTONES ── */}
        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
