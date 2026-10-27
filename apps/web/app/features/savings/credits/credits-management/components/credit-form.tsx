'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BadgeDollarSign,
  Building2,
  Calculator,
  Settings,
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { Switch } from '@repo/shadcn/switch';
import { Label } from '@repo/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import {
  creditManagementSchema,
  creditDefaults,
  type CreditManagement,
} from '../schemas/credits-management.schema';
import {
  useCreditTypes,
  useBankAccounts,
  useSuppliers,
  useProducts,
} from '../hooks/use-credits-management-query';
import { type SearchAssociateResult } from '../schemas/credits-management-api-response';
import { PAYMENT_TYPE_LABELS } from '../schemas/credits-management-options';
import { useWithdrawalTypesQuery } from '@/features/savings/withdrawals/withdrawal/hooks/use-withdrawal-query';
import { apiClient } from '@/lib/api-client';
import { CreditCalculator } from './credit-calculator';
import { ProductsService } from '@/features/inventory/products/services/products-service';
import { exchangeRatesService } from '@/features/core/exchange-rates/services/exchange-rates-service';
import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import { CATEGORY_TYPES } from '@/features/core/categories/schemas/categories.schema';
import { calculateFrenchAmortization } from '../utils/credit-amortization-utils';
import { useAuthStore } from '@/stores/auth.store';

interface CreditFormProps {
  selectedAssociate: SearchAssociateResult | null;
  isSubmitting: boolean;
  onSubmit: (data: CreditManagement) => void;
  onCancel: () => void;
  isEdit?: boolean;
  initialData?: Partial<CreditManagement>;
}

function formatCurrency(n: number) {
  return n?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

export function CreditForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  onCancel,
  isEdit = false,
  initialData,
}: CreditFormProps) {
  const { data: creditTypes = [] } = useCreditTypes();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { data: specialDays = [] } = useCategoriesByTypeQuery(CATEGORY_TYPES.SPECIAL_DAYS);
  const { data: withdrawalTypesResp } = useWithdrawalTypesQuery();
  const withdrawalTypes = withdrawalTypesResp?.data ?? [];

  const [casaComercial, setCasaComercial] = useState(false);
  const [ccType, setCcType] = useState<'inventory' | 'supplier' | ''>('');
  const [useSpecial, setUseSpecial] = useState(false);
  const canUseSpecialParams = useAuthStore((s) =>
    s.hasPermission('portfolio:credits', 'special_params'),
  );
  const [items, setItems] = useState<any[]>([]);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [servDescription, setServDescription] = useState('');
  const [servQty, setServQty] = useState(1);
  const [servCost, setServCost] = useState(0);
  const [servSpecialDayId, setServSpecialDayId] = useState('');

  const serviceSuppliers = useMemo(
    () =>
      Array.isArray(suppliers)
        ? suppliers.filter(
          (s: any) =>
            (s.category === 'services' || s.category === 'servicio') &&
            s.isActive !== false,
        )
        : [],
    [suppliers],
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<CreditManagement>({
    resolver: zodResolver(creditManagementSchema),
    defaultValues: { ...creditDefaults, ...initialData },
  });

  const watchTypeId = useWatch({ control, name: 'creditTypeId' });
  const watchId = useWatch({ control, name: 'id' });
  const watchAmount = useWatch({ control, name: 'requestedAmount' }) || 0;
  const watchRate = useWatch({ control, name: 'interestRate' }) || 0;
  const watchTermUnits = useWatch({ control, name: 'termUnits' }) || 0;
  const watchStartDate = useWatch({ control, name: 'startDate' });
  const watchTermType = useWatch({ control, name: 'termType' });
  const watchExpensesPct = useWatch({ control, name: 'expensesPercentage' }) || 0;
  const watchHaberesPayment = useWatch({ control, name: 'haberesPayment' }) || 0;
  const watchCurrency = useWatch({ control, name: 'currencyCode' }) || 'VES';
  const watchExchangeRate =
    useWatch({ control, name: 'exchangeRate' }) || 0;
  const creditSymbol = watchCurrency !== 'VES' ? watchCurrency : 'Bs';
  const creditFx = watchCurrency !== 'VES' ? watchExchangeRate || 1 : 1;
  const haberesInCreditCurrency = watchHaberesPayment / creditFx;
  const watchDirectPayment = useWatch({ control, name: 'directPayment' }) || 0;
  const watchOverdraft = useWatch({ control, name: 'allowOverdraft' });
  const watchAllowExceedCapacity = useWatch({
    control,
    name: 'allowExceedPaymentCapacity',
  });
  const watchAllowPayrollCredit = useWatch({
    control,
    name: 'allowPayrollCredit',
  });
  const watchWithdrawalTypeId = useWatch({
    control,
    name: 'withdrawalTypeId',
  });
  const watchDirectPaymentMethod = useWatch({ control, name: 'directPaymentMethod' });

  // Tasa BCV del día para la moneda del crédito (editable). No se sobrescribe
  // la tasa de un crédito ya existente.
  useEffect(() => {
    if (watchId) return;
    if (!watchCurrency || watchCurrency === 'VES') {
      setValue('exchangeRate', 1);
      return;
    }
    // Mientras se consulta la tasa del día, el backend la resuelve si llega 0.
    setValue('exchangeRate', 0);
    apiClient
      .get(`/core/exchange-rates/latest/${watchCurrency}`)
      .then((res) => {
        const rate = Number(res.data?.rate);
        if (Number.isFinite(rate) && rate > 0) {
          setValue('exchangeRate', rate);
        }
      })
      .catch(() => {});
  }, [watchCurrency, watchId, setValue]);
  const watchDirectPaymentBank = useWatch({ control, name: 'directPaymentBankAccountId' });

  const selectedType = useMemo(
    () =>
      Array.isArray(creditTypes)
        ? creditTypes.find((t: any) => t.id === watchTypeId)
        : null,
    [watchTypeId, creditTypes],
  );

  const totalItemAmount = useMemo(
    () => items.reduce((sum: number, it: any) => sum + it.totalPrice, 0),
    [items],
  );

  useEffect(() => {
    if (casaComercial && totalItemAmount > 0) {
      // Los items se valoran en Bs; el crédito se expresa en su moneda.
      const fx = watchCurrency !== 'VES' ? watchExchangeRate || 1 : 1;
      setValue('requestedAmount', +(totalItemAmount / fx).toFixed(2));
    }
  }, [
    totalItemAmount,
    casaComercial,
    watchCurrency,
    watchExchangeRate,
    setValue,
  ]);

  const handleTypeChange = useCallback(
    (typeId: string) => {
      setValue('creditTypeId', typeId);
      const t = Array.isArray(creditTypes)
        ? creditTypes.find((ct: any) => ct.id === typeId)
        : null;
      if (t) {
        setValue('interestRate', parseFloat(t.interestRate) || 0);
        const mappedTermType =
          t.termType === 'Plazo' || t.termType === 'Plazos'
            ? 'installments'
            : t.termType === 'Cuota' || t.termType === 'Cuotas'
              ? 'quotas'
              : (t.termType as string) || 'installments';
        setValue('termType', mappedTermType);
        setValue('termUnits', Number(t.termUnits) || 1);
        setValue(
          'expensesPercentage',
          parseFloat(t.administrativeExpensePercentage || '0'),
        );
      }
    },
    [creditTypes, setValue],
  );

  const expensesAmount = useMemo(
    () => (watchAmount * watchExpensesPct) / 100,
    [watchAmount, watchExpensesPct],
  );

  const amortizableAmount = Math.max(
    0,
    watchAmount - watchHaberesPayment / creditFx - watchDirectPayment,
  );

  const endDate = useMemo(() => {
    if (!watchStartDate || watchTermUnits <= 0) return '';
    const start = new Date(watchStartDate);
    if (watchTermType === 'installments') {
      const totalDays = watchTermUnits * 15;
      return new Date(start.getTime() + totalDays * 86400000)
        .toISOString()
        .slice(0, 10);
    }
    start.setMonth(start.getMonth() + watchTermUnits);
    return start.toISOString().slice(0, 10);
  }, [watchStartDate, watchTermUnits, watchTermType]);

  useEffect(() => {
    if (endDate) {
      setValue('endDate', endDate);
    }
  }, [endDate, setValue]);

  const amortData = useMemo(() => {
    if (amortizableAmount <= 0 || watchTermUnits <= 0) return null;
    return calculateFrenchAmortization(
      amortizableAmount,
      watchRate,
      watchTermUnits,
      (watchTermType as 'installments' | 'quotas') || 'installments',
      watchStartDate || new Date(),
      expensesAmount,
    );
  }, [amortizableAmount, watchRate, watchTermUnits, watchTermType, watchStartDate, expensesAmount]);

  const totalInterest = amortData?.totalInterest ?? 0;

  const rules = useMemo(() => {
    const r: { canSave: boolean; messages: string[] } = {
      canSave: true,
      messages: [],
    };
    if (!selectedAssociate) {
      r.canSave = false;
      r.messages.push('Asociado no encontrado o sin cuenta');
      return r;
    }
    if (watchAmount <= 0) {
      r.canSave = false;
      r.messages.push('Debe ingresar un monto mayor a 0');
    }
    if (useSpecial && watchOverdraft) {
      r.messages.push('Sobregiro activado - regla del 80% excluida');
    } else if (watchAmount * creditFx > selectedAssociate.available80) {
      r.canSave = false;
      r.messages.push(
        `El monto (${formatCurrency(watchAmount * creditFx)} Bs) supera el 80% disponible (${formatCurrency(selectedAssociate.available80)} Bs)`,
      );
    } else if (watchAmount > 0) {
      r.messages.push(
        `Disponible 80%: ${formatCurrency(selectedAssociate.available80)} Bs`,
      );
    }
    if (selectedAssociate.hasActiveLoan) {
      r.canSave = false;
      r.messages.push('Tiene un préstamo en proceso o activo - Bloqueado');
    }
    if (selectedAssociate.hasActiveCredit) {
      r.canSave = false;
      r.messages.push('Tiene un crédito en proceso o activo - Bloqueado');
    }
    if (selectedAssociate.hasPayrollCredit) {
      if (useSpecial && watchAllowPayrollCredit) {
        r.messages.push(
          'Credinomina activo - Permitido por parámetro especial',
        );
      } else {
        r.canSave = false;
        r.messages.push('Tiene credinomina activo - Bloqueado');
      }
    }
    if (watchHaberesPayment > 0 && !watchWithdrawalTypeId) {
      r.canSave = false;
      r.messages.push('Tipo de retiro de haberes obligatorio - Bloqueado');
    }
    const monthlyPmt = amortData?.monthlyPayment ?? 0;
    if (
      amortizableAmount > 0 &&
      monthlyPmt > 0 &&
      monthlyPmt * creditFx > selectedAssociate.paymentCapacity &&
      !watchAllowExceedCapacity
    ) {
      r.canSave = false;
      r.messages.push(
        `La cuota (${formatCurrency(monthlyPmt * creditFx)} Bs) supera su capacidad de pago del 30% (${formatCurrency(selectedAssociate.paymentCapacity)} Bs)`,
      );
    } else if (watchAllowExceedCapacity && monthlyPmt > 0) {
      r.messages.push(
        'Capacidad de pago excedida - Permitido por parámetro especial',
      );
    } else if (selectedAssociate.paymentCapacity > 0) {
      r.messages.push(
        `Capacidad de pago (30%): ${formatCurrency(selectedAssociate.paymentCapacity)} Bs`,
      );
    }
    if (useSpecial && watchDirectPayment > 0 && !watchDirectPaymentMethod) {
      r.canSave = false;
      r.messages.push('Debe seleccionar un método de pago directo');
    }
    if (
      useSpecial &&
      watchDirectPayment > 0 &&
      watchDirectPaymentMethod &&
      !watchDirectPaymentBank
    ) {
      r.canSave = false;
      r.messages.push('Debe seleccionar un banco receptor');
    }
    if (!selectedType) {
      r.canSave = false;
      r.messages.push('Seleccione un tipo de crédito');
    }
    if (
      selectedType?.minCreditAmount &&
      parseFloat(selectedType.minCreditAmount) > 0 &&
      watchAmount * creditFx < parseFloat(selectedType.minCreditAmount)
    ) {
      r.canSave = false;
      r.messages.push(
        `El monto mínimo para este tipo es ${formatCurrency(parseFloat(selectedType.minCreditAmount))} Bs`,
      );
    }
    if (
      selectedType?.maxCreditAmount &&
      parseFloat(selectedType.maxCreditAmount) > 0 &&
      watchAmount * creditFx > parseFloat(selectedType.maxCreditAmount)
    ) {
      r.canSave = false;
      r.messages.push(
        `El monto máximo para este tipo es ${formatCurrency(parseFloat(selectedType.maxCreditAmount))} Bs`,
      );
    }
    return r;
  }, [
    selectedAssociate,
    watchAmount,
    creditFx,
    amortizableAmount,
    selectedType,
    amortData,
    useSpecial,
    watchOverdraft,
    watchAllowExceedCapacity,
    watchAllowPayrollCredit,
    watchWithdrawalTypeId,
    watchHaberesPayment,
    watchDirectPayment,
    watchDirectPaymentMethod,
    watchDirectPaymentBank,
  ]);

  const addProductItem = async () => {
    if (!selectedProduct || !Array.isArray(products)) return;
    const prod = products.find((p: any) => p.id === selectedProduct) as any;
    if (!prod) return;

    try {
      const productDetail = await ProductsService.getById(selectedProduct);
      // El precio de venta está fijado en divisa; el monto en Bs se calcula a la
      // tasa del día de la venta.
      const currency = (productDetail.currencyCode ?? 'VES') as
        | 'VES'
        | 'USD'
        | 'EUR';
      const saleReference = Number(
        productDetail.salePrice ??
          productDetail.bsPriceAmount ??
          productDetail.supplierCost ??
          0,
      );
      let factor = 1;
      if (currency !== 'VES') {
        try {
          const latest = await exchangeRatesService.getLatest(currency);
          const rate = Number(latest.rate);
          if (Number.isFinite(rate) && rate > 0) factor = rate;
        } catch {
          factor = 1;
        }
      }
      const unitPriceBs = +(saleReference * factor).toFixed(2);
      setItems((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          type: 'product',
          productId: prod.id,
          productName: prod.name,
          quantity: productQty,
          unitPrice: saleReference,
          currencyCode: currency,
          exchangeRate: factor,
          unitPriceBs,
          totalPrice: +(unitPriceBs * productQty).toFixed(2),
        },
      ]);
    } catch {
      setItems((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          type: 'product',
          productId: prod.id,
          productName: prod.name,
          quantity: productQty,
          unitPrice: 0,
          currencyCode: 'VES',
          exchangeRate: 1,
          unitPriceBs: 0,
          totalPrice: 0,
        },
      ]);
    }
    setSelectedProduct('');
    setProductQty(1);
  };

  // Permite modificar el precio de venta en divisa y recalcula el monto en Bs
  // con la tasa del día.
  const updateItemPrice = (id: string, value: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const rate = it.exchangeRate || 1;
        const isForeign = it.type === 'product' && it.currencyCode !== 'VES';
        const unitPriceBs = isForeign
          ? +(value * rate).toFixed(2)
          : value;
        return {
          ...it,
          unitPrice: value,
          unitPriceBs,
          totalPrice: +(unitPriceBs * (it.quantity || 0)).toFixed(2),
        };
      }),
    );
  };

  const updateItemQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              quantity: qty,
              totalPrice: +((it.unitPriceBs ?? it.unitPrice ?? 0) * qty).toFixed(
                2,
              ),
            }
          : it,
      ),
    );
  };

  const addServiceItem = () => {
    if (!servDescription.trim() || servCost <= 0 || !servSpecialDayId) return;
    const totalPrice = servCost * servQty;
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: 'service',
        description: servDescription,
        quantity: servQty,
        unitPrice: servCost,
        unitPriceBs: servCost,
        totalPrice,
        specialDayCategoryId: servSpecialDayId,
      },
    ]);
    setServDescription('');
    setServQty(1);
    setServCost(0);
    setServSpecialDayId('');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleFormSubmit = (data: CreditManagement) => {
    const rate = Number(data.interestRate);
    const creditFx =
      data.currencyCode && data.currencyCode !== 'VES'
        ? Number(data.exchangeRate) || 1
        : 1;
    const formatted: CreditManagement = {
      ...data,
      requestedAmount: Number(data.requestedAmount),
      termUnits: Number(data.termUnits),
      expensesPercentage: Number(data.expensesPercentage || 0),
      commercialHouseType: casaComercial
        ? ccType.startsWith('supplier')
          ? 'supplier'
          : 'inventory'
        : undefined,
      commercialHouseSupplierId:
        casaComercial && ccType.startsWith('supplier_')
          ? ccType.replace('supplier_', '')
          : undefined,
      creditItems: casaComercial
        ? items.map((it) => ({
          // La venta se registra en la moneda del crédito.
          agreedSellingPrice: +(it.totalPrice / creditFx).toFixed(2),
          itemId: it.productId || undefined,
          itemType: it.type === 'product' ? 'PRODUCT' : 'EXTERNAL',
          itemDescription: it.description || it.productName || undefined,
          quantity: it.quantity,
          saleDate: new Date(),
          days: it.specialDayCategoryId || undefined,
        }))
        : undefined,
      itemsJson: casaComercial ? JSON.stringify(items) : undefined,
      haberesPayment: Number(data.haberesPayment || 0),
      directPayment: Number(data.directPayment || 0),
    };

    // El backend rechaza una tasa de interés igual a 0 (`.positive()`). Si no
    // hay una tasa válida mayor a 0, se omite para que el API use la tasa
    // configurada en el tipo de crédito.
    if (Number.isFinite(rate) && rate > 0) {
      formatted.interestRate = rate;
    } else {
      delete (formatted as { interestRate?: number }).interestRate;
    }

    onSubmit(formatted);
  };

  if (!selectedAssociate) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Busque un asociado para continuar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tipo de Crédito */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" />
            Tipo de Crédito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de Crédito *</Label>
            <Select value={watchTypeId} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de crédito" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(creditTypes) ? creditTypes : []).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <div className="rounded-lg border border-[#3098F2]/30 bg-[#3098F2]/5 p-4 space-y-2">
              <p className="text-sm font-semibold">
                Información del Tipo de Crédito
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tasa Anual:</span>{' '}
                  <span className="font-medium">
                    {selectedType.interestRate}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">% Gasto Admin:</span>{' '}
                  <span className="font-medium">
                    {selectedType.administrativeExpensePercentage || '0'}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cuotas/Plazos:</span>{' '}
                  <span className="font-medium">{selectedType.termUnits}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Modalidad:</span>{' '}
                  <span className="font-medium">
                    {PAYMENT_TYPE_LABELS[selectedType.termType] ||
                      selectedType.termType}
                  </span>
                </div>
                {selectedType.minCreditAmount && (
                  <div>
                    <span className="text-muted-foreground">Monto Mín:</span>{' '}
                    <span className="font-medium">
                      {formatCurrency(parseFloat(selectedType.minCreditAmount))} Bs
                    </span>
                  </div>
                )}
                {selectedType.maxCreditAmount && (
                  <div>
                    <span className="text-muted-foreground">Monto Máx:</span>{' '}
                    <span className="font-medium">
                      {formatCurrency(parseFloat(selectedType.maxCreditAmount))} Bs
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parámetros del Crédito */}
      {selectedType && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Parámetros del Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Moneda del Crédito *</Label>
                <Select
                  value={watchCurrency}
                  onValueChange={(v) => setValue('currencyCode', v as any)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VES">Bolívares (VES)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                    <SelectItem value="EUR">Euros (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {watchCurrency !== 'VES' && (
                <div>
                  <Label>Tasa de Cambio ({watchCurrency}) *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    className="mt-1"
                    {...register('exchangeRate', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Monto en Bs:{' '}
                    {formatCurrency(
                      (watchAmount || 0) * (watchExchangeRate || 0),
                    )}{' '}
                    Bs
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {!casaComercial && (
                <div className="col-span-2">
                  <Label>Monto del Crédito ({watchCurrency}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('requestedAmount', { valueAsNumber: true })}
                  />
                  {errors.requestedAmount && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.requestedAmount.message as string}
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label>Tasa de Interés Anual (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('interestRate', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label>% Gasto Administrativo</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('expensesPercentage', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label>Modalidad de Pago *</Label>
                <Select
                  value={watchTermType}
                  onValueChange={(v) => setValue('termType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installments">
                      Plazos (Quincenal)
                    </SelectItem>
                    <SelectItem value="quotas">Cuotas (Mensual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad de Cuotas/Plazos *</Label>
                <Input
                  type="number"
                  min="1"
                  {...register('termUnits', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label>Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={
                    watchStartDate
                      ? new Date(watchStartDate).toISOString().slice(0, 10)
                      : ''
                  }
                  onChange={(e) =>
                    setValue('startDate', new Date(e.target.value))
                  }
                />
              </div>
              <div>
                <Label>Fecha de Culminación</Label>
                <Input type="date" value={endDate} disabled className="bg-muted/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casa Comercial */}
      {selectedType && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2
                  className={`h-5 w-5 ${casaComercial ? 'text-blue-600' : 'text-muted-foreground'}`}
                />
                Casa Comercial
              </CardTitle>
              <button
                type="button"
                onClick={() => {
                  setCasaComercial(!casaComercial);
                  if (casaComercial) {
                    setCcType('');
                    setItems([]);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${casaComercial ? 'bg-blue-600' : 'bg-muted'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${casaComercial ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </CardHeader>
          {casaComercial && (
            <CardContent className="space-y-4">
              <div>
                <Label>Seleccionar Casa Comercial</Label>
                <Select
                  value={ccType}
                  onValueChange={(v) => {
                    setCcType(v as any);
                    setItems([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">Inventario Interno</SelectItem>
                    {serviceSuppliers.map((s: any) => (
                      <SelectItem key={s.id} value={`supplier_${s.id}`}>
                        {s.name || s.businessName} - {s.rif}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {ccType === 'inventory' && (
                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-semibold">AGREGAR PRODUCTO</span>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Producto</Label>
                      <Select
                        value={selectedProduct}
                        onValueChange={setSelectedProduct}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Producto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(products) ? products : []).map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">Cant.</Label>
                      <Input
                        type="number"
                        min="1"
                        value={productQty}
                        onChange={(e) =>
                          setProductQty(Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                    </div>
                    <Button onClick={addProductItem} size="sm" className="gap-1">
                      <Plus className="h-3 w-3" /> Agregar
                    </Button>
                  </div>
                </div>
              )}

              {ccType.startsWith('supplier_') && (
                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs font-semibold">AGREGAR ITEM</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                    <div className="col-span-full">
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        value={servDescription}
                        onChange={(e) => setServDescription(e.target.value)}
                        placeholder="Descripción..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cant.</Label>
                      <Input
                        type="number"
                        min="1"
                        value={servQty}
                        onChange={(e) =>
                          setServQty(Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Costo Unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={servCost}
                        onChange={(e) => setServCost(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Jornada *</Label>
                      <Select
                        value={servSpecialDayId}
                        onValueChange={setServSpecialDayId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Jornada..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(specialDays)
                            ? specialDays.map((sd: any) => (
                              <SelectItem key={sd.id} value={sd.id}>
                                {sd.name}
                              </SelectItem>
                            ))
                            : null}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addServiceItem} size="sm" className="gap-1">
                        <Plus className="h-3 w-3" /> Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="rounded-lg border p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="h-4 w-4" />
                    <span className="text-xs font-semibold">
                      ITEMS ({items.length})
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1 text-left">Item</th>
                        <th className="py-1 text-right">Cant.</th>
                        <th className="py-1 text-right">P/U</th>
                        {items.some((it) => it.type === 'service') && (
                          <th className="py-1 text-left">Jornada</th>
                        )}
                        <th className="py-1 text-right">Subtotal</th>
                        <th className="py-1 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id} className="border-b last:border-0">
                          <td className="py-1">
                            {it.productName || it.description}
                          </td>
                          <td className="py-1 text-right">
                            <Input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) =>
                                updateItemQty(it.id, Number(e.target.value) || 0)
                              }
                              className="h-7 w-16 text-xs text-right font-mono ml-auto"
                            />
                          </td>
                          <td className="py-1 text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={it.unitPrice ?? ''}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(
                                  /[^0-9.]/g,
                                  '',
                                );
                                updateItemPrice(
                                  it.id,
                                  cleaned ? parseFloat(cleaned) : 0,
                                );
                              }}
                              className="h-7 w-24 text-xs text-right font-mono ml-auto"
                            />
                            {it.type === 'product' &&
                              it.currencyCode &&
                              it.currencyCode !== 'VES' && (
                                <div className="text-[10px] text-muted-foreground">
                                  {it.currencyCode} ×{' '}
                                  {Number(it.exchangeRate || 1).toFixed(2)} ={' '}
                                  {formatCurrency(it.unitPriceBs ?? 0)}
                                </div>
                              )}
                          </td>
                          {items.some((i) => i.type === 'service') && (
                            <td className="py-1 text-xs">
                              {it.specialDayCategoryId
                                ? (Array.isArray(specialDays)
                                  ? specialDays.find((sd: any) => sd.id === it.specialDayCategoryId)?.name
                                  : '—') || '—'
                                : '—'}
                            </td>
                          )}
                          <td className="py-1 text-right font-mono font-medium">
                            {formatCurrency(it.totalPrice)}
                          </td>
                          <td className="py-1 text-right">
                            <button
                              onClick={() => removeItem(it.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between pt-2 text-xs font-bold border-t mt-1">
                    <span>Total Items:</span>
                    <span className="font-mono">
                      {formatCurrency(totalItemAmount)} Bs
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Parámetros Especiales */}
      {selectedType && canUseSpecialParams && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings
                  className={`h-5 w-5 ${useSpecial ? 'text-blue-600' : 'text-muted-foreground'}`}
                />
                Parámetros Especiales
              </CardTitle>
              <button
                type="button"
                onClick={() => {
                  setUseSpecial(!useSpecial);
                  if (useSpecial) {
                    setValue('allowOverdraft', false);
                    setValue('allowExceedPaymentCapacity', false);
                    setValue('allowPayrollCredit', false);
                    setValue('withdrawalTypeId', undefined);
                    setValue('haberesPayment', 0);
                    setValue('directPayment', 0);
                    setValue('directPaymentMethod', '');
                    setValue('directPaymentReference', '');
                    setValue('directPaymentBankAccountId', '');
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useSpecial ? 'bg-blue-600' : 'bg-muted'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useSpecial ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </CardHeader>
          {useSpecial && (
            <CardContent className="space-y-4 bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 rounded-md border bg-background p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm">Permitir sobregiro</Label>
                  <p className="text-xs text-muted-foreground">
                    Excluye la regla del 80% disponible.
                  </p>
                </div>
                <Switch
                  checked={!!watchOverdraft}
                  onCheckedChange={(v) => setValue('allowOverdraft', v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border bg-background p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm">
                    Permitir superar la capacidad de pago
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Omite la regla de la cuota máxima (30% del salario).
                  </p>
                </div>
                <Switch
                  checked={!!watchAllowExceedCapacity}
                  onCheckedChange={(v) =>
                    setValue('allowExceedPaymentCapacity', v)
                  }
                />
              </div>
              {selectedAssociate?.hasPayrollCredit && (
                <div className="flex items-center justify-between gap-4 rounded-md border bg-background p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">
                      Permitir crédito con credinomina activa
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Omite el bloqueo por credinomina.
                    </p>
                  </div>
                  <Switch
                    checked={!!watchAllowPayrollCredit}
                    onCheckedChange={(v) =>
                      setValue('allowPayrollCredit', v)
                    }
                  />
                </div>
              )}
              <div>
                <Label>Monto a pagar de haberes (Bs) (genera retiro)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('haberesPayment', { valueAsNumber: true })}
                />
              </div>
              {watchHaberesPayment > 0 && (
                <div>
                  <Label>Tipo de retiro para el pago con haberes *</Label>
                  <Select
                    value={watchWithdrawalTypeId || ''}
                    onValueChange={(v) => setValue('withdrawalTypeId', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar tipo de retiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {withdrawalTypes.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Monto de pago directo ({creditSymbol})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('directPayment', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label>Método de pago</Label>
                  <Select
                    value={watchDirectPaymentMethod || ''}
                    onValueChange={(v) => setValue('directPaymentMethod', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="deposit">Depósito</SelectItem>
                      <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {watchDirectPayment > 0 && watchDirectPaymentMethod && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Referencia de pago</Label>
                    <Input {...register('directPaymentReference')} />
                  </div>
                  <div>
                    <Label>Banco receptor</Label>
                    <Select
                      value={watchDirectPaymentBank || ''}
                      onValueChange={(v) =>
                        setValue('directPaymentBankAccountId', v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(bankAccounts) ? bankAccounts : []).map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.accountName || b.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {(watchHaberesPayment > 0 || watchDirectPayment > 0) && (
                <div className="text-sm space-y-1 bg-muted/30 p-3 rounded">
                  <p>
                    Monto del crédito:{' '}
                    <span className="font-mono font-bold">
                      {formatCurrency(watchAmount)} {creditSymbol}
                    </span>
                  </p>
                  {watchHaberesPayment > 0 && (
                    <p>
                      Pago desde los haberes:{' '}
                      <span className="font-mono text-destructive">
                        - {formatCurrency(haberesInCreditCurrency)} {creditSymbol}
                      </span>
                    </p>
                  )}
                  {watchDirectPayment > 0 && (
                    <p>
                      Pago directo:{' '}
                      <span className="font-mono text-destructive">
                        - {formatCurrency(watchDirectPayment)} {creditSymbol}
                      </span>
                    </p>
                  )}
                  <p className="font-semibold">
                    Monto a amortizar:{' '}
                    <span className="font-mono text-emerald-600">
                      {formatCurrency(amortizableAmount)} {creditSymbol}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Notas */}
      {selectedType && (
        <Card>
          <CardContent className="pt-4">
            <Label>Observaciones</Label>
            <Textarea
              {...register('notes')}
              placeholder="Observaciones opcionales..."
              className="min-h-[60px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Calculadora de Amortización */}
      {amortData && selectedType && watchAmount > 0 && (
        <CreditCalculator
          capital={watchAmount}
          amortizableAmount={amortizableAmount}
          monthlyPayment={String(amortData?.monthlyPayment ?? 0)}
          totalInterest={totalInterest}
          schedule={amortData.schedule}
          expensesAmount={expensesAmount}
          haberesPayment={watchHaberesPayment}
          directPayment={watchDirectPayment}
          currencyCode={watchCurrency}
          exchangeRate={watchExchangeRate}
        />
      )}

      {/* Reglas de Validación */}
      <Card
        className={
          rules.canSave
            ? 'border-emerald-500/30 bg-muted/30'
            : 'border-destructive/30 bg-destructive/5'
        }
      >
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center gap-2">
            {rules.canSave ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            <span className="text-sm font-semibold">
              {rules.canSave ? 'REGLA(S) CUMPLIDA(S)' : 'REGLA(S) BLOQUEANTE(S)'}
            </span>
          </div>
          <ul className="space-y-1">
            {rules.messages.map((msg, i) => (
              <li
                key={i}
                className={`text-xs flex items-center gap-1.5 ${msg.includes('Bloqueado') ||
                  msg.includes('supera') ||
                  msg.includes('mínimo') ||
                  msg.includes('máximo')
                  ? 'text-destructive'
                  : 'text-emerald-600'
                  }`}
              >
                {msg.includes('Bloqueado') ||
                  msg.includes('supera') ||
                  msg.includes('mínimo') ||
                  msg.includes('máximo') ? (
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                )}
                {msg}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={!rules.canSave || isSubmitting}
          className="bg-blue-600 gap-1.5"
        >
          {isSubmitting ? 'Guardando...' : 'Solicitar Crédito'}
        </Button>
      </div>
    </div>
  );
}
