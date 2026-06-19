import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import { Button } from '@repo/shadcn/button';
import { Switch } from '@repo/shadcn/switch';
import { Badge } from '@repo/shadcn/badge';
import { Separator } from '@repo/shadcn/separator';
import { useForm, useWatch } from 'react-hook-form';
import { useAuthStore } from '@/stores/auth.store';
import { useCategoriesQuery, useProductDefaults } from '../hooks/use-products-queries';
import { useProductMutation } from '../hooks/use-products-mutations';
import { type Product, type ProductSupplierAssignment, productSchema } from '../schemas/products.schema';
import { UNIT_MEASURES } from '../schemas/products-options';
import { Package, Settings, Box, DollarSign, BadgePercent, Tag, Truck, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Supplier } from '@/features/purchasing/suppliers/schemas/suppliers.schema';

interface ProductsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Product>;
  readOnly?: boolean;
}

function toFormValues(data: Partial<Product> | undefined): Partial<Product> {
  if (!data) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = value === null ? undefined : value;
  }
  return sanitized as Partial<Product>;
}

const CURRENCY_OPTIONS = [
  { value: 'VES', label: 'Bolívares (VES)' },
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'EUR', label: 'Euros (EUR)' },
] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  VES: 'Bs.',
  USD: '$',
  EUR: '€',
};

export function ProductsForm({ onSuccess, onCancel, defaultValues, readOnly = false }: ProductsFormProps) {
  const { mutateAsync: saveProduct, isPending: isSaving } = useProductMutation();
  const { data: categories, isLoading: isLoadingCategories } = useCategoriesQuery();
  const { data: settings } = useProductDefaults();
  const { user } = useAuthStore();
  const isEmpresaComercial = user?.memberships?.[0]?.bussinessType === 'EMPRESA_COMERCIAL';

  const [suppliers, setSuppliers] = useState<ProductSupplierAssignment[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [newLeadTime, setNewLeadTime] = useState(0);

  const { data: activeSuppliers } = useQuery<Supplier[]>({
    queryKey: ['active-suppliers'],
    queryFn: async () => {
      const res = await apiClient.get('/purchasing/suppliers/all');
      return (res.data?.data ?? res.data ?? []).filter((s: Supplier) => s.status === 'ACTIVE');
    },
  });

  useEffect(() => {
    if (settings && !defaultValues?.id) {
      form.setValue('purchaseTaxPercent', settings.taxPurchases);
      form.setValue('salesTaxPercent', settings.taxSales);
    }
  }, [settings, defaultValues?.id]);

  const form = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', description: '', categoryId: undefined,
      brand: '', model: '', sku: '',
      stockMin: 0, stockMax: 0, reorderPoint: 0,
      status: 'COMMING_SOON', unitOfMeasure: 'UNIT',
      currencyCode: 'VES',
      purchaseExchangeRate: 1, salesExchangeRate: 1,
      supplierCost: 0, otherCosts: 0, purchaseTaxPercent: 16,
      profitSale: 0, expensePercent: 0, salesTaxPercent: 16,
      profitSupply: undefined,
      suppliers: [],
      ...toFormValues(defaultValues),
    },
  });

  // ── Watch values for live calculations ──
  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });
  const isForeignCurrency = isEmpresaComercial && currencyCode !== 'VES';
  const supplierCost = useWatch({ control: form.control, name: 'supplierCost' });
  const otherCosts = useWatch({ control: form.control, name: 'otherCosts' });
  const purchaseTaxPct = useWatch({ control: form.control, name: 'purchaseTaxPercent' });
  const purchaseRate = useWatch({ control: form.control, name: 'purchaseExchangeRate' });
  const profitSale = useWatch({ control: form.control, name: 'profitSale' });
  const expensePct = useWatch({ control: form.control, name: 'expensePercent' });
  const salesTaxPct = useWatch({ control: form.control, name: 'salesTaxPercent' });
  const salesRate = useWatch({ control: form.control, name: 'salesExchangeRate' });
  const profitSupply = useWatch({ control: form.control, name: 'profitSupply' });
  const salePrice = useWatch({ control: form.control, name: 'salePrice' });
  const offerSalePrice = useWatch({ control: form.control, name: 'offerSalePrice' });
  const bsPriceAmount = useWatch({ control: form.control, name: 'bsPriceAmount' });

  useEffect(() => {
    if (defaultValues?.id) {
      apiClient.get(`/inventory/product-service-suppliers?productId=${defaultValues.id}`)
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
    if (!isEmpresaComercial || currencyCode === 'VES') return;
    apiClient.get(`/core/exchange-rates/latest/${currencyCode}`)
      .then((res) => {
        if (res.data?.rate) {
          const rate = parseFloat(res.data.rate);
          if (!isNaN(rate) && rate > 0) {
            form.setValue('purchaseExchangeRate', rate, { shouldDirty: true });
            form.setValue('salesExchangeRate', rate, { shouldDirty: true });
          }
        }
      })
      .catch(() => {});
  }, [currencyCode, isEmpresaComercial]);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      form.reset({
        name: '', description: '', categoryId: undefined,
        brand: '', model: '', sku: '',
        stockMin: 0, stockMax: 0, reorderPoint: 0,
        status: 'COMMING_SOON', unitOfMeasure: 'UNIT',
        currencyCode: 'VES',
        purchaseExchangeRate: 1, salesExchangeRate: 1,
        supplierCost: 0, otherCosts: 0, purchaseTaxPercent: 16,
        profitSale: 0, expensePercent: 0, salesTaxPercent: 16,
        profitSupply: undefined,
        suppliers: [],
        ...toFormValues(defaultValues),
      });
    }
  }, [defaultValues]);

  const offerActive = isForeignCurrency
    ? (Number(offerSalePrice) || 0) > 0
    : (profitSupply ?? 0) > 0;
  const [enableBsPricing, setEnableBsPricing] = useState(false);

  // ── Live calculations ──
  const costCalc = useMemo(() => {
    const base = Number(supplierCost) || 0;
    const other = Number(otherCosts) || 0;
    const taxPct = Number(purchaseTaxPct) || 0;
    const pRate = Number(purchaseRate) || 1;
    const taxAmount = (base + other) * (taxPct / 100);
    const total = base + other + taxAmount;
    return {
      baseCost: base,
      otherCosts: other,
      purchaseTaxAmount: +taxAmount.toFixed(2),
      totalCost: +total.toFixed(2),
      totalCostVes: +(total * pRate).toFixed(2),
    };
  }, [supplierCost, otherCosts, purchaseTaxPct, purchaseRate]);

  const priceCalc = useMemo(() => {
    const totalCost = costCalc.totalCost;
    const stPct = Number(salesTaxPct) || 0;
    const sRate = Number(salesRate) || 1;

    if (isForeignCurrency && (Number(salePrice) || 0) > 0) {
      const sp = Number(salePrice) || 0;
      const finalGross = sp;
      const finalNet = +(finalGross / (1 + stPct / 100)).toFixed(6);
      const hasBs = enableBsPricing && (Number(bsPriceAmount) || 0) > 0;
      const vesMult = hasBs ? (Number(bsPriceAmount) || 0) : finalGross;
      return {
        costPlusExpense: totalCost,
        finalPriceNet: +finalNet.toFixed(2),
        salesTaxAmount: +(finalGross - finalNet).toFixed(2),
        finalPriceGross: +finalGross.toFixed(2),
        finalPriceGrossVes: +(vesMult * sRate).toFixed(2),
      };
    }

    const pPct = Number(profitSale) || 0;
    const ePct = Number(expensePct) || 0;
    const costPlusExpense = totalCost * (1 + ePct / 100);
    const finalNet = costPlusExpense * (1 + pPct / 100);
    const salesTaxAmt = finalNet * (stPct / 100);
    const finalGross = finalNet + salesTaxAmt;
    return {
      costPlusExpense: +costPlusExpense.toFixed(2),
      finalPriceNet: +finalNet.toFixed(2),
      salesTaxAmount: +salesTaxAmt.toFixed(2),
      finalPriceGross: +finalGross.toFixed(2),
      finalPriceGrossVes: +(finalGross * sRate).toFixed(2),
    };
  }, [costCalc.totalCost, profitSale, expensePct, salesTaxPct, salesRate, isForeignCurrency, salePrice, enableBsPricing, bsPriceAmount]);

  const offerCalc = useMemo(() => {
    if (!offerActive) return null;
    const stPct = Number(salesTaxPct) || 0;
    const sRate = Number(salesRate) || 1;

    if (isForeignCurrency) {
      const sp = Number(offerSalePrice) || 0;
      const finalGross = sp;
      const finalNet = +(finalGross / (1 + stPct / 100)).toFixed(6);
      return {
        costPlusExpense: 0,
        finalPriceNet: +finalNet.toFixed(2),
        finalPriceGross: +finalGross.toFixed(2),
        finalPriceGrossVes: +(finalGross * sRate).toFixed(2),
      };
    }

    const totalCost = costCalc.totalCost;
    const pPct = Number(profitSupply) || 0;
    const ePct = Number(expensePct) || 0;
    const costPlusExpense = totalCost * (1 + ePct / 100);
    const finalNet = costPlusExpense * (1 + pPct / 100);
    const salesTaxAmt = finalNet * (stPct / 100);
    const finalGross = finalNet + salesTaxAmt;
    return {
      costPlusExpense: +costPlusExpense.toFixed(2),
      finalPriceNet: +finalNet.toFixed(2),
      finalPriceGross: +finalGross.toFixed(2),
      finalPriceGrossVes: +(finalGross * sRate).toFixed(2),
    };
  }, [offerActive, isForeignCurrency, costCalc.totalCost, profitSupply, offerSalePrice, expensePct, salesTaxPct, salesRate]);

  const sym = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;

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

  const onSubmit = async (data: Product) => {
    const payload = {
      ...data,
      currencyCode: currencyCode || 'VES',
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      _suppliers: suppliers.map((s) => ({ suppliersId: s.suppliersId, leadTimeDays: s.leadTimeDays })),
    };
    saveProduct(payload as any, {
      onSuccess: () => { form.reset(); onSuccess?.(); },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ──────── 1. INFORMACIÓN BÁSICA ──────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Información Básica del Producto</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Nombre del producto" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl><Input placeholder="Código SKU" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={readOnly}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione categoría" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="" disabled>Cargando...</SelectItem>
                      ) : categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl><Input placeholder="Marca" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl><Input placeholder="Modelo" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl><Textarea placeholder="Descripción del producto" className="resize-none" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ──────── 2. CONFIGURACIÓN ──────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-base">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="unitOfMeasure" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de Medida</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                    <FormControl><SelectTrigger className='w-full'><SelectValue placeholder="Seleccione unidad" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {UNIT_MEASURES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="purchaseTaxPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel>IVA de Compra (%)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="16.00" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="salesTaxPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel>IVA de Venta (%)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="16.00" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {isEmpresaComercial && (
                <FormField control={form.control} name="currencyCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda de Operación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                      <FormControl><SelectTrigger className='w-full'><SelectValue placeholder="Seleccione moneda" /></SelectTrigger></FormControl>
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
            </div>
          </CardContent>
        </Card>

        {/* ──────── 3. STOCK ──────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <Box className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Stock Inventario</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="stockMin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stockMax" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Máximo</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reorderPoint" render={({ field }) => (
                <FormItem>
                  <FormLabel>Punto de Reorden</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ──────── 4. COSTOS DE ADQUISICIÓN ──────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Costos de Adquisición</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="supplierCost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo del Proveedor ({currencyCode})</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="otherCosts" render={({ field }) => (
                <FormItem>
                  <FormLabel>Otros Costos ({currencyCode})</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} disabled={readOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {isForeignCurrency && (
                <FormField control={form.control} name="purchaseExchangeRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de Cambio (Compra)</FormLabel>
                    <FormControl><Input type="text" inputMode="decimal" placeholder="1.00" {...field} disabled={readOnly} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            {/* ── Resumen de Costos ── */}
            {Number(supplierCost) > 0 && (
              <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                <p className="font-medium text-muted-foreground mb-1">Resumen de Costos</p>
                <div className="flex justify-between"><span>Costo Base:</span><span>{sym} {costCalc.baseCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Otros Costos:</span><span>{sym} {costCalc.otherCosts.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>IVA de Compra ({purchaseTaxPct}%):</span><span>{sym} {costCalc.purchaseTaxAmount.toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Costo Total:</span><span>{sym} {costCalc.totalCost.toFixed(2)}</span></div>
                {isForeignCurrency && (
                  <div className="flex justify-between text-xs text-muted-foreground"><span>Costo Total en VES:</span><span>Bs. {costCalc.totalCostVes.toFixed(2)}</span></div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ──────── 5. FIJACIÓN DE PRECIOS ──────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <BadgePercent className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">Fijación de Precios y Margen de Utilidad</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isForeignCurrency ? (
                <>
                  <FormField control={form.control} name="salePrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de Venta en {currencyCode}</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="salesExchangeRate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasa de Cambio (Venta)</FormLabel>
                      <FormControl><Input type="text" inputMode="decimal" placeholder="1.00" {...field} disabled={readOnly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={enableBsPricing}
                        onCheckedChange={setEnableBsPricing}
                        disabled={readOnly}
                      />
                      <p className="text-sm text-muted-foreground">
                        {enableBsPricing
                          ? `Precio en ${currencyCode} habilitado para pago en Bs.`
                          : `Habilitar precio en ${currencyCode} para pago en Bs.`}
                      </p>
                    </div>
                  </div>
                  {enableBsPricing && (
                    <FormField control={form.control} name="bsPriceAmount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio en {currencyCode} para pago en Bs.</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} disabled={readOnly} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </>
              ) : (
                <>
                  <FormField control={form.control} name="profitSale" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Margen de Ganancia (%)</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} disabled={readOnly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="expensePercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel>% Gastos Operativos</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} disabled={readOnly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}
            </div>

            {/* ── Resumen de Precios ── */}
            {isForeignCurrency && (Number(salePrice) || 0) > 0 && (
              <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                <p className="font-medium text-muted-foreground mb-1">Resumen de Precio de Venta en {currencyCode}</p>
                <div className="flex justify-between"><span>Precio Neto (sin IVA):</span><span>{sym} {priceCalc.finalPriceNet.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>IVA Venta ({salesTaxPct}%):</span><span>{sym} {priceCalc.salesTaxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold" ><span>Precio Final de Venta en {currencyCode}:</span><span>{sym} {priceCalc.finalPriceGross.toFixed(2)}</span></div>
                <Separator />
                {enableBsPricing && (Number(bsPriceAmount) || 0) > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Precio Final para pago en Bs.:</span>
                    <span>{sym} {Number(bsPriceAmount).toFixed(2)} × tasa = Bs. {((Number(bsPriceAmount) || 0) * (Number(salesRate) || 1)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            {!isForeignCurrency && costCalc.totalCost > 0 && (
              <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                <p className="font-medium text-muted-foreground mb-1">Resumen de Precio de Venta</p>
                <div className="flex justify-between"><span>Costo Total:</span><span>{sym} {costCalc.totalCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Gastos ({expensePct}%):</span><span>{sym} {(priceCalc.costPlusExpense - costCalc.totalCost).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Utilidad ({profitSale}%):</span><span>{sym} {(priceCalc.finalPriceNet - priceCalc.costPlusExpense).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>IVA Venta ({salesTaxPct}%):</span><span>{sym} {priceCalc.salesTaxAmount.toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Precio Final (con IVA):</span><span>{sym} {priceCalc.finalPriceGross.toFixed(2)}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ──────── 6. OFERTA ──────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
            <Tag className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base">Precio Oferta</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isForeignCurrency ? (
              <FormField control={form.control} name="offerSalePrice" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={offerActive}
                      onCheckedChange={(checked) => field.onChange(checked ? 10 : undefined)}
                      disabled={readOnly}
                    />
                    <p className="text-sm text-muted-foreground">
                      {offerActive ? 'Oferta activa' : 'Activar precio promocional'}
                    </p>
                  </div>
                  {offerActive && (
                    <div className="mt-3 space-y-3">
                      <div className="max-w-xs">
                        <FormLabel>Precio de Venta Oferta en {currencyCode}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={readOnly} />
                        </FormControl>
                        <FormMessage />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                        <FormField control={form.control} name="offerStartDate" render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Fecha Inicio</FormLabel>
                            <FormControl><Input type="date" {...f} value={f.value ?? ''} disabled={readOnly} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="offerEndDate" render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Fecha Fin</FormLabel>
                            <FormControl><Input type="date" {...f} value={f.value ?? ''} disabled={readOnly} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  {/* ── Resumen de Oferta en divisa ── */}
                  {offerActive && offerCalc && (
                    <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm mt-3">
                      <p className="font-medium text-muted-foreground mb-1">Resumen de Precio Oferta en {currencyCode}</p>
                      <div className="flex justify-between"><span>IVA Venta ({salesTaxPct}%):</span><span>{sym} {(offerCalc.finalPriceGross - offerCalc.finalPriceNet).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Precio Oferta:</span><span>{sym} {offerCalc.finalPriceGross.toFixed(2)}</span></div>

                      <Separator />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Diferencia vs Precio Regular:</span>
                        <span className="text-red-500">{sym} {(priceCalc.finalPriceGross - offerCalc.finalPriceGross).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Precio Oferta para pago en Bs.:</span>
                        <span>{sym} {offerCalc.finalPriceGross.toFixed(2)} × tasa = Bs. {offerCalc.finalPriceGrossVes.toFixed(2)}</span>
                      </div>


                    </div>
                  )}
                </FormItem>
              )} />
            ) : (
              <FormField control={form.control} name="profitSupply" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={offerActive}
                      onCheckedChange={(checked) => field.onChange(checked ? 10 : undefined)}
                      disabled={readOnly}
                    />
                    <p className="text-sm text-muted-foreground">
                      {offerActive ? 'Oferta activa' : 'Activar precio promocional'}
                    </p>
                  </div>
                  {offerActive && (
                    <div className="mt-3 space-y-3">
                      <div className="max-w-xs">
                        <FormLabel>Margen de Ganancia para Oferta (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="10.00" {...field} disabled={readOnly} />
                        </FormControl>
                        <FormMessage />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                        <FormField control={form.control} name="offerStartDate" render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Fecha Inicio</FormLabel>
                            <FormControl><Input type="date" {...f} value={f.value ?? ''} disabled={readOnly} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="offerEndDate" render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Fecha Fin</FormLabel>
                            <FormControl><Input type="date" {...f} value={f.value ?? ''} disabled={readOnly} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  {/* ── Resumen de Oferta ── */}
                  {offerActive && offerCalc && costCalc.totalCost > 0 && (
                    <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm mt-3">
                      <p className="font-medium text-muted-foreground mb-1">Resumen de Precio Oferta</p>
                      <div className="flex justify-between"><span>Precio Neto:</span><span>{sym} {offerCalc.finalPriceNet.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Precio Final (con IVA):</span><span>{sym} {offerCalc.finalPriceGross.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Diferencia vs Precio Regular:</span>
                        <span className="text-red-500">{sym} {(priceCalc.finalPriceGross - offerCalc.finalPriceGross).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </FormItem>
              )} />
            )}
          </CardContent>
        </Card>

        {/* ──────── 7. PROVEEDORES ──────── */}
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

        {/* ──────── BOTONES ──────── */}
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