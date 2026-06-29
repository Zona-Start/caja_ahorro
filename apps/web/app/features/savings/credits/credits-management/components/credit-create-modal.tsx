'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Search,
  User,
  Wallet,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import { Badge } from '@repo/shadcn/badge';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  creditManagementSchema,
  creditDefaults,
  type CreditManagement,
} from '../schemas/credits-management.schema';
import {
  useSearchAssociate,
  useCreditTypes,
  useBankAccounts,
  useSuppliers,
  useProducts,
  useCalculateAmortization,
} from '../hooks/use-credits-management-query';
import { useCreateCreditManagementMutation } from '../hooks/use-credits-management-mutation';
import { type SearchAssociateResult } from '../schemas/credits-management-api-response';
import { PAYMENT_TYPE_LABELS } from '../schemas/credits-management-options';

function formatCurrency(n: number) {
  return n?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

interface CreateCreditModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCreditModal({ open, onClose }: CreateCreditModalProps) {
  const [cedula, setCedula] = useState('');
  const [shouldSearch, setShouldSearch] = useState(false);
  const [casaComercial, setCasaComercial] = useState(false);
  const [ccType, setCcType] = useState<'inventory' | 'supplier' | ''>('');
  const [useSpecial, setUseSpecial] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [servDescription, setServDescription] = useState('');
  const [servQty, setServQty] = useState(1);
  const [servCost, setServCost] = useState(0);

  const { data: associateData } = useSearchAssociate(
    shouldSearch ? cedula : '',
    { enabled: shouldSearch && cedula.length >= 7 },
  );
  const { data: creditTypes = [] } = useCreditTypes();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { mutate: saveCredit, isPending: isSaving } =
    useCreateCreditManagementMutation();

  const serviceSuppliers = useMemo(
    () =>
      Array.isArray(suppliers)
        ? suppliers.filter(
            (s: any) =>
              s.category === 'SERVICE' && s.isActive !== false,
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
    defaultValues: { ...creditDefaults },
  });

  const watchTypeId = useWatch({ control, name: 'creditTypeId' });
  const watchAmount = useWatch({ control, name: 'requestedAmount' }) || 0;
  const watchRate = useWatch({ control, name: 'interestRate' }) || 0;
  const watchTermUnits = useWatch({ control, name: 'termUnits' }) || 1;
  const watchStartDate = useWatch({ control, name: 'startDate' });
  const watchTermType = useWatch({ control, name: 'termType' });
  const watchExpensesPct = useWatch({ control, name: 'expensesPercentage' }) || 0;
  const watchHaberesPayment = useWatch({ control, name: 'haberesPayment' }) || 0;
  const watchDirectPayment = useWatch({ control, name: 'directPayment' }) || 0;
  const watchOverdraft = useWatch({ control, name: 'allowOverdraft' });
  const watchDirectPaymentMethod = useWatch({ control, name: 'directPaymentMethod' });
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
      setValue('requestedAmount', totalItemAmount);
    }
  }, [totalItemAmount, casaComercial, setValue]);

  const resetAll = useCallback(() => {
    setCedula('');
    setShouldSearch(false);
    setCasaComercial(false);
    setCcType('');
    setUseSpecial(false);
    setItems([]);
    setSelectedProduct('');
    setProductQty(1);
    setServDescription('');
    setServQty(1);
    setServCost(0);
    reset({ ...creditDefaults });
  }, [reset]);

  useEffect(() => {
    if (open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleTypeChange = useCallback(
    (typeId: string) => {
      setValue('creditTypeId', typeId);
      const t = Array.isArray(creditTypes)
        ? creditTypes.find((ct: any) => ct.id === typeId)
        : null;
      if (t) {
        setValue('interestRate', parseFloat(t.interestRate));
        setValue(
          'termType',
          (t.termType as 'installments' | 'quotas') || 'installments',
        );
        setValue('termUnits', t.termUnits || 1);
        setValue(
          'expensesPercentage',
          parseFloat(t.administrativeExpensePercentage || '0'),
        );
      }
    },
    [creditTypes, setValue],
  );

  useEffect(() => {
    if (associateData?.associate?.id) {
      setValue('associateId', associateData.associate.id);
    }
  }, [associateData, setValue]);

  const expensesAmount = useMemo(
    () => (watchAmount * watchExpensesPct) / 100,
    [watchAmount, watchExpensesPct],
  );

  const amortizableAmount = watchAmount - watchHaberesPayment - watchDirectPayment;

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
    if (endDate) setValue('endDate', endDate);
  }, [endDate, setValue]);

  const amortParams = useMemo(
    () =>
      amortizableAmount > 0 && watchRate > 0 && watchTermUnits > 0 && watchStartDate
        ? {
            amount: amortizableAmount,
            annualRate: watchRate,
            paymentCount: watchTermUnits,
            startDate: new Date(watchStartDate).toISOString().slice(0, 10),
            paymentType: watchTermType,
            expensesPercentage: watchExpensesPct,
          }
        : null,
    [amortizableAmount, watchRate, watchTermUnits, watchStartDate, watchTermType, watchExpensesPct],
  );

  const { data: amortData } = useCalculateAmortization(amortParams);

  const totalInterest = useMemo(
    () =>
      amortData?.schedule?.reduce(
        (s: number, r: any) => s + parseFloat(r.interestAmount),
        0,
      ) || 0,
    [amortData],
  );

  const totalPayable = useMemo(
    () => amortizableAmount + totalInterest + expensesAmount,
    [amortizableAmount, totalInterest, expensesAmount],
  );

  const rules = useMemo(() => {
    const r: { canSave: boolean; messages: string[] } = {
      canSave: true,
      messages: [],
    };
    if (!associateData) {
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
    } else if (watchAmount > associateData.available80) {
      r.canSave = false;
      r.messages.push(
        `El monto (${formatCurrency(watchAmount)}) supera el 80% disponible (${formatCurrency(associateData.available80)})`,
      );
    } else if (watchAmount > 0) {
      r.messages.push(
        `Disponible 80%: ${formatCurrency(associateData.available80)} Bs`,
      );
    }
    if (associateData.hasActiveLoan) {
      r.canSave = false;
      r.messages.push('Tiene un préstamo activo - Bloqueado');
    }
    if (associateData.hasActiveCredit) {
      r.canSave = false;
      r.messages.push('Tiene un crédito activo - Bloqueado');
    }
    if (associateData.hasPayrollCredit) {
      r.canSave = false;
      r.messages.push('Tiene credinomina activo - Bloqueado');
    }
    const monthlyPmt = parseFloat(amortData?.monthlyPayment || '0');
    if (
      amortizableAmount > 0 &&
      monthlyPmt > 0 &&
      monthlyPmt > associateData.paymentCapacity
    ) {
      r.canSave = false;
      r.messages.push(
        `La cuota (${formatCurrency(monthlyPmt)}) supera capacidad de pago del 30% (${formatCurrency(associateData.paymentCapacity)})`,
      );
    } else if (associateData.paymentCapacity > 0) {
      r.messages.push(
        `Capacidad de pago (30%): ${formatCurrency(associateData.paymentCapacity)} Bs`,
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
      watchAmount < parseFloat(selectedType.minCreditAmount)
    ) {
      r.canSave = false;
      r.messages.push(
        `El monto mínimo es ${formatCurrency(parseFloat(selectedType.minCreditAmount))} Bs`,
      );
    }
    if (
      selectedType?.maxCreditAmount &&
      watchAmount > parseFloat(selectedType.maxCreditAmount)
    ) {
      r.canSave = false;
      r.messages.push(
        `El monto máximo es ${formatCurrency(parseFloat(selectedType.maxCreditAmount))} Bs`,
      );
    }
    return r;
  }, [
    associateData,
    watchAmount,
    amortizableAmount,
    selectedType,
    amortData,
    useSpecial,
    watchOverdraft,
    watchDirectPayment,
    watchDirectPaymentMethod,
    watchDirectPaymentBank,
  ]);

  const addProductItem = useCallback(() => {
    if (!selectedProduct || !Array.isArray(products)) return;
    const prod = products.find(
      (p: any) => p.id === selectedProduct || p._id === selectedProduct,
    );
    if (!prod) return;
    const price = prod.offerPrice || prod.regularPrice;
    if (!price) return;
    const unitPrice = price.salePrice || price.unitPrice || 0;
    const totalPrice = unitPrice * productQty;
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: 'product',
        productId: prod.id || prod._id,
        productName: prod.name,
        quantity: productQty,
        unitPrice,
        totalPrice,
      },
    ]);
    setSelectedProduct('');
    setProductQty(1);
  }, [selectedProduct, productQty, products]);

  const addServiceItem = useCallback(() => {
    const totalPrice = servCost * servQty;
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: 'service',
        description: servDescription,
        quantity: servQty,
        unitPrice: servCost,
        totalPrice,
      },
    ]);
    setServDescription('');
    setServQty(1);
    setServCost(0);
  }, [servDescription, servQty, servCost]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const onSubmit = useCallback(
    (data: CreditManagement) => {
      const formatted = {
        ...data,
        associateId: data.associateId || associateData?.associate?.id,
        requestedAmount: Number(data.requestedAmount),
        interestRate: Number(data.interestRate),
        termUnits: Number(data.termUnits),
        expensesPercentage: Number(data.expensesPercentage || 0),
        useCommercialHouse: casaComercial || undefined,
        commercialHouseType: casaComercial
          ? ccType.startsWith('supplier_')
            ? ('supplier' as const)
            : ('inventory' as const)
          : undefined,
        commercialHouseSupplierId:
          casaComercial && ccType.startsWith('supplier_')
            ? ccType.replace('supplier_', '')
            : undefined,
        creditItems: casaComercial
          ? items.map((it) => ({
              agreedSellingPrice: it.totalPrice,
              itemId: it.productId || undefined,
              itemType: it.type === 'product'
                ? ('PRODUCT' as const)
                : ('EXTERNAL' as const),
              itemDescription: it.description || it.productName || undefined,
              quantity: it.quantity,
              saleDate: new Date(),
            }))
          : undefined,
        itemsJson: casaComercial ? JSON.stringify(items) : undefined,
        haberesPayment: Number(data.haberesPayment || 0),
        directPayment: Number(data.directPayment || 0),
      };

      saveCredit(formatted, {
        onSuccess: () => {
          onClose();
        },
      });
    },
    [saveCredit, onClose, associateData, casaComercial, ccType, items],
  );

  const handleClose = useCallback(() => {
    resetAll();
    onClose();
  }, [resetAll, onClose]);

  const hasBlocks =
    associateData?.hasActiveLoan ||
    associateData?.hasActiveCredit ||
    associateData?.hasPayrollCredit;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" /> Nueva Solicitud de Crédito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pr-1">
          {/* Búsqueda de Asociado */}
          <div>
            <Label>Cédula del Asociado</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ej: 19354301"
                value={cedula}
                onChange={(e) => {
                  setCedula(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setShouldSearch(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cedula.length >= 7) setShouldSearch(true);
                }}
                className="pl-9"
                maxLength={8}
              />
            </div>
          </div>

          {cedula.length >= 7 && !associateData && shouldSearch && (
            <p className="text-sm text-destructive">Asociado no encontrado</p>
          )}

          {associateData && (
            <div
              className={`rounded-lg border p-4 space-y-3 ${hasBlocks ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-500/30 bg-emerald-50'}`}
            >
              <div className="flex items-center gap-2">
                <User
                  className={`h-4 w-4 ${hasBlocks ? 'text-destructive' : 'text-emerald-600'}`}
                />
                <span className="text-sm font-semibold">DATOS DEL ASOCIADO</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{' '}
                  <span className="font-medium">
                    {associateData.associate.fullname}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cédula:</span>{' '}
                  <span className="font-mono">
                    {associateData.associate.cedula}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nro. Cuenta:</span>{' '}
                  <span className="font-mono">
                    {associateData.account?.accountNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Saldo Total:</span>{' '}
                  <span className="font-mono font-semibold text-blue-600">
                    {formatCurrency(associateData.balance)} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Salario Base:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(associateData.baseSalary)} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cap. Pago (30%):</span>{' '}
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatCurrency(associateData.paymentCapacity)} Bs/mes
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">80% Disponible:</span>
                </div>
                <span className="text-lg font-bold text-blue-600 font-mono">
                  {formatCurrency(associateData.available80)} Bs
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {associateData.hasActiveLoan && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">
                    <XCircle className="h-3 w-3" /> Préstamo Activo
                  </span>
                )}
                {associateData.hasActiveCredit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">
                    <XCircle className="h-3 w-3" /> Crédito Activo
                  </span>
                )}
                {associateData.hasPayrollCredit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">
                    <XCircle className="h-3 w-3" /> Credinomina Activo
                  </span>
                )}
                {!hasBlocks && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 text-emerald-600 px-2.5 py-0.5 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Sin bloqueos
                  </span>
                )}
              </div>
            </div>
          )}

          {associateData && (
            <>
              {/* Tipo de Crédito */}
              <div>
                <Label>Tipo de Crédito *</Label>
                <Select value={watchTypeId} onValueChange={handleTypeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar tipo de crédito" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(creditTypes) ? creditTypes : []).map(
                      (t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">
                      INFORMACIÓN DEL TIPO DE CRÉDITO
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tasa Anual:</span>{' '}
                      <span className="font-medium">
                        {selectedType.interestRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">% Gasto:</span>{' '}
                      <span className="font-medium">
                        {selectedType.administrativeExpensePercentage || '0'}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plazos:</span>{' '}
                      <span className="font-medium">
                        {selectedType.termUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Modalidad:</span>{' '}
                      <span className="font-medium">
                        {PAYMENT_TYPE_LABELS[selectedType.termType] ||
                          selectedType.termType}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Parámetros del Crédito */}
              {selectedType && (
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      PARÁMETROS DEL CRÉDITO
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {!casaComercial && (
                      <div className="col-span-2">
                        <Label>Monto del Crédito *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
                        {...register('expensesPercentage', {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div>
                      <Label>Modalidad de Pago *</Label>
                      <Select
                        value={watchTermType}
                        onValueChange={(v) => setValue('termType', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="installments">
                            Plazos (Quincenal)
                          </SelectItem>
                          <SelectItem value="quotas">
                            Cuotas (Mensual)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cantidad de Cuotas/Plazos *</Label>
                      <Input
                        type="number"
                        min="1"
                        className="mt-1"
                        {...register('termUnits', { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label>Fecha de Inicio *</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={
                          watchStartDate
                            ? new Date(watchStartDate)
                                .toISOString()
                                .slice(0, 10)
                            : ''
                        }
                        onChange={(e) =>
                          setValue('startDate', new Date(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label>Fecha de Culminación</Label>
                      <Input
                        type="date"
                        value={endDate}
                        disabled
                        className="mt-1 bg-muted/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Casa Comercial */}
              {selectedType && (
                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2
                        className={`h-4 w-4 ${casaComercial ? 'text-blue-600' : 'text-muted-foreground'}`}
                      />
                      <span className="text-sm font-semibold">
                        CASA COMERCIAL
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !casaComercial;
                        setCasaComercial(next);
                        if (!next) {
                          setCcType('');
                          setItems([]);
                          setValue('requestedAmount', 0);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${casaComercial ? 'bg-blue-600' : 'bg-muted'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${casaComercial ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>

                  {casaComercial && (
                    <div className="space-y-4">
                      <div>
                        <Label>Seleccionar Casa Comercial</Label>
                        <Select
                          value={ccType}
                          onValueChange={(v) => {
                            setCcType(v as any);
                            setItems([]);
                            setSelectedProduct('');
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inventory">
                              Inventario Interno
                            </SelectItem>
                            {serviceSuppliers.map((s: any) => (
                              <SelectItem
                                key={s.id || s._id}
                                value={`supplier_${s.id || s._id}`}
                              >
                                {s.name || s.businessName} - {s.rif}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {ccType === 'inventory' && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span className="text-xs font-semibold">
                              AGREGAR PRODUCTO
                            </span>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">Producto</Label>
                              <Select
                                value={selectedProduct}
                                onValueChange={setSelectedProduct}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Producto..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Array.isArray(products)
                                    ? products
                                    : []
                                  ).map((p: any) => (
                                    <SelectItem
                                      key={p.id || p._id}
                                      value={p.id || p._id}
                                    >
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
                                className="mt-1"
                                value={productQty}
                                onChange={(e) =>
                                  setProductQty(
                                    Math.max(
                                      1,
                                      parseInt(e.target.value) || 1,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <Button
                              onClick={addProductItem}
                              size="sm"
                              className="bg-blue-600 gap-1"
                            >
                              <Plus className="h-3 w-3" /> Agregar
                            </Button>
                          </div>
                        </div>
                      )}

                      {ccType.startsWith('supplier_') && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            <span className="text-xs font-semibold">
                              AGREGAR ITEM
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 items-end">
                            <div className="col-span-3">
                              <Label className="text-xs">Descripción</Label>
                              <Input
                                className="mt-1"
                                value={servDescription}
                                onChange={(e) =>
                                  setServDescription(e.target.value)
                                }
                                placeholder="Descripción..."
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Cant.</Label>
                              <Input
                                type="number"
                                min="1"
                                className="mt-1"
                                value={servQty}
                                onChange={(e) =>
                                  setServQty(
                                    Math.max(
                                      1,
                                      parseInt(e.target.value) || 1,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Costo Unit.</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="mt-1"
                                value={servCost}
                                onChange={(e) =>
                                  setServCost(parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                onClick={addServiceItem}
                                size="sm"
                                className="bg-blue-600 gap-1"
                              >
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
                                <th className="py-1 text-right">Subtotal</th>
                                <th className="py-1 w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((it) => (
                                <tr
                                  key={it.id}
                                  className="border-b last:border-0"
                                >
                                  <td className="py-1">
                                    {it.productName || it.description}
                                  </td>
                                  <td className="py-1 text-right font-mono">
                                    {it.quantity}
                                  </td>
                                  <td className="py-1 text-right font-mono">
                                    {formatCurrency(it.unitPrice)}
                                  </td>
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
                    </div>
                  )}
                </div>
              )}

              {/* Parámetros Especiales */}
              {selectedType && (
                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings
                        className={`h-4 w-4 ${useSpecial ? 'text-blue-600' : 'text-muted-foreground'}`}
                      />
                      <span className="text-sm font-semibold">
                        PARÁMETROS ESPECIALES
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !useSpecial;
                        setUseSpecial(next);
                        if (!next) {
                          setValue('allowOverdraft', false);
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

                  {useSpecial && (
                    <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="allowOverdraft"
                          {...register('allowOverdraft')}
                          className="rounded"
                        />
                        <Label
                          htmlFor="allowOverdraft"
                          className="text-sm"
                        >
                          Permitir sobregiro (excluye regla del 80%)
                        </Label>
                      </div>
                      <div>
                        <Label>Monto a pagar de haberes (genera retiro)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="mt-1"
                          {...register('haberesPayment', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Monto de pago directo</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="mt-1"
                            {...register('directPayment', {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div>
                          <Label>Método de pago</Label>
                          <Select
                            value={watchDirectPaymentMethod || ''}
                            onValueChange={(v) =>
                              setValue('directPaymentMethod', v)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transfer">
                                Transferencia
                              </SelectItem>
                              <SelectItem value="deposit">Depósito</SelectItem>
                              <SelectItem value="pago_movil">
                                Pago Móvil
                              </SelectItem>
                              <SelectItem value="check">Cheque</SelectItem>
                              <SelectItem value="cash">Efectivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {watchDirectPayment > 0 &&
                        watchDirectPaymentMethod && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Referencia de pago</Label>
                              <Input
                                className="mt-1"
                                {...register('directPaymentReference')}
                              />
                            </div>
                            <div>
                              <Label>Banco receptor</Label>
                              <Select
                                value={watchDirectPaymentBank || ''}
                                onValueChange={(v) =>
                                  setValue('directPaymentBankAccountId', v)
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Array.isArray(bankAccounts)
                                    ? bankAccounts
                                    : []
                                  ).map((b: any) => (
                                    <SelectItem key={b.id} value={b.id}>
                                      {b.accountName || b.accountNumber} -{' '}
                                      {b.accountNumber}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      {(watchHaberesPayment > 0 ||
                        watchDirectPayment > 0) && (
                        <div className="text-sm space-y-1 bg-blue-50 p-3 rounded">
                          <p>
                            Monto del crédito:{' '}
                            <span className="font-mono font-bold">
                              {formatCurrency(watchAmount)} Bs
                            </span>
                          </p>
                          {watchHaberesPayment > 0 && (
                            <p>
                              Pago de haberes:{' '}
                              <span className="font-mono text-destructive">
                                - {formatCurrency(watchHaberesPayment)} Bs
                              </span>
                            </p>
                          )}
                          {watchDirectPayment > 0 && (
                            <p>
                              Pago directo:{' '}
                              <span className="font-mono text-destructive">
                                - {formatCurrency(watchDirectPayment)} Bs
                              </span>
                            </p>
                          )}
                          <p className="font-semibold">
                            Monto a amortizar:{' '}
                            <span className="font-mono text-emerald-600">
                              {formatCurrency(amortizableAmount)} Bs
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Observaciones */}
              {selectedType && (
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    className="mt-1 min-h-[60px]"
                    {...register('notes')}
                    placeholder="Observaciones opcionales..."
                  />
                </div>
              )}

              {/* Resumen del Crédito */}
              {selectedType && amortizableAmount > 0 && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold">
                      RESUMEN DEL CRÉDITO
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Capital:</span>{' '}
                      <span className="font-mono font-medium">
                        {formatCurrency(watchAmount)} Bs
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cuota:</span>{' '}
                      <span className="font-mono font-bold text-blue-600">
                        {formatCurrency(
                          parseFloat(amortData?.monthlyPayment || '0'),
                        )}{' '}
                        Bs
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Interés Total:
                      </span>{' '}
                      <span className="font-mono">
                        {formatCurrency(totalInterest)} Bs
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Gasto Admin:
                      </span>{' '}
                      <span className="font-mono">
                        {formatCurrency(expensesAmount)} Bs
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        Total a Pagar:
                      </span>{' '}
                      <span className="font-mono font-bold text-lg">
                        {formatCurrency(totalPayable)} Bs
                      </span>
                    </div>
                  </div>

                  {amortData?.schedule &&
                    amortData.schedule.length > 0 && (
                      <div className="rounded-lg border bg-white p-3 mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          TABLA DE AMORTIZACIÓN
                        </p>
                        <div className="max-h-40 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="py-1 text-left">#</th>
                                <th className="py-1 text-left">
                                  Vencimiento
                                </th>
                                <th className="py-1 text-right">Capital</th>
                                <th className="py-1 text-right">Interés</th>
                                <th className="py-1 text-right">Cuota</th>
                                <th className="py-1 text-right">Saldo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {amortData.schedule.map(
                                (row: any) => (
                                  <tr
                                    key={row.installmentNumber}
                                    className="border-b last:border-0"
                                  >
                                    <td className="py-1">
                                      {row.installmentNumber}
                                    </td>
                                    <td className="py-1">
                                      {new Date(
                                        row.dueDate,
                                      ).toLocaleDateString('es')}
                                    </td>
                                    <td className="py-1 text-right font-mono">
                                      {formatCurrency(
                                        parseFloat(row.principalAmount),
                                      )}
                                    </td>
                                    <td className="py-1 text-right font-mono">
                                      {formatCurrency(
                                        parseFloat(row.interestAmount),
                                      )}
                                    </td>
                                    <td className="py-1 text-right font-mono">
                                      {formatCurrency(
                                        parseFloat(
                                          row.totalInstallmentAmount,
                                        ),
                                      )}
                                    </td>
                                    <td className="py-1 text-right font-mono">
                                      {formatCurrency(
                                        parseFloat(
                                          row.principalBalancePending,
                                        ),
                                      )}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Reglas */}
              <div
                className={`rounded-lg border p-3 ${rules.canSave ? 'border-emerald-500/30 bg-emerald-50/50' : 'border-destructive/30 bg-destructive/5'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {rules.canSave ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm font-semibold">
                    {rules.canSave
                      ? 'REGLA(S) CUMPLIDA(S)'
                      : 'REGLA(S) BLOQUEANTE(S)'}
                  </span>
                </div>
                <ul className="space-y-1">
                  {rules.messages.map((msg, i) => (
                    <li
                      key={i}
                      className={`text-xs flex items-center gap-1.5 ${
                        msg.includes('Bloqueado') ||
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
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={!rules.canSave || isSaving}
                  className="bg-blue-600 gap-1.5"
                >
                  {isSaving ? 'Guardando...' : 'Solicitar Crédito'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
