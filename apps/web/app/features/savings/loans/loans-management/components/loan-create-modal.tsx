'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  HandCoins,
  Calculator,
  CheckCircle2,
  XCircle,
  Search,
  User,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { Separator } from '@repo/shadcn/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Textarea } from '@repo/shadcn/textarea';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  loanManagementSchema,
  loanDefaults,
  type LoanManagement,
} from '../schemas/loans-management.schema';
import { useSearchAssociate } from '../hooks/use-loans-management-query';
import { useCreateLoansManagementMutation } from '../hooks/use-loans-management-mutation';
import { PAYMENT_TYPE_LABELS } from '../schemas/loans-management-options';
import { calculateFrenchAmortization } from '../utils/loan-amortization-utils';
import { AlertModal } from '@/components/shared/alert-modal';
import { loansManagementKeys } from '../keys/loans-management-keys';
import { useLoanTypesQuery } from '../../type-loans/hooks/use-type-loans-query';
import { useBankAccountAllQuery } from '@/features/banks/bank-account/hooks/use-bank-account-query';

function formatCurrency(n: number) {
  return n?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

interface CreateLoanModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateLoanModal({ open, onClose }: CreateLoanModalProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: associateData, isFetching: searching } = useSearchAssociate(
    submittedSearch,
    { enabled: shouldFetch && !!submittedSearch.trim() },
  );
  const { data: loanTypesData } = useLoanTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    true,
  );
  const loanTypes = loanTypesData?.data ?? [];
  const { data: bankAccounts = [] } = useBankAccountAllQuery();
  const { mutate: saveLoan, isPending: isSaving } =
    useCreateLoansManagementMutation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<LoanManagement>({
    resolver: zodResolver(loanManagementSchema),
    defaultValues: { ...loanDefaults },
  });

  const watchTypeId = useWatch({ control, name: 'loanTypeId' });
  const watchAmount = useWatch({ control, name: 'requestedAmount' }) || 0;
  const watchRate = useWatch({ control, name: 'interestRate' }) || 0;
  const watchTermUnits = useWatch({ control, name: 'termUnits' }) || 1;
  const watchStartDate = useWatch({ control, name: 'startDate' });
  const watchTermType = useWatch({ control, name: 'termType' });
  const watchExpensesPct = useWatch({ control, name: 'expensesPercentage' }) || 0;

  const selectedType = useMemo(
    () =>
      Array.isArray(loanTypes)
        ? loanTypes.find((t: any) => t.id === watchTypeId)
        : null,
    [watchTypeId, loanTypes],
  );

  const resetAll = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearch('');
    setShouldFetch(false);
    reset({ ...loanDefaults });
  }, [reset]);

  useEffect(() => {
    if (open) resetAll();
  }, [open]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    queryClient.removeQueries({
      queryKey: loansManagementKeys.all,
      exact: false,
    });
    reset({ ...loanDefaults });
    setSubmittedSearch(trimmed);
    setShouldFetch(true);
  }, [searchQuery, queryClient, reset]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearch('');
    setShouldFetch(false);
    reset({ ...loanDefaults });
    queryClient.removeQueries({
      queryKey: loansManagementKeys.all,
      exact: false,
    });
  }, [queryClient, reset]);

  useEffect(() => {
    if (shouldFetch && !searching) {
      setShouldFetch(false);
      if (associateData?.associate?.id) {
        setValue('associateId', associateData.associate.id);
      }
    }
  }, [searching, shouldFetch, associateData, setValue]);

  const handleTypeChange = useCallback(
    (typeId: string) => {
      setValue('loanTypeId', typeId);
      const t = Array.isArray(loanTypes)
        ? loanTypes.find((lt: any) => lt.id === typeId)
        : null;
      if (t) {
        setValue('interestRate', Number(t.interestRate));
        const mappedTermType =
          t.termType === 'Plazos'
            ? 'installments'
            : t.termType === 'Cuotas'
              ? 'quotas'
              : 'installments';
        setValue('termType', mappedTermType);
        setValue('termUnits', Number(t.termUnits) || 1);
        setValue(
          'expensesPercentage',
          Number(t.administrativeExpensePercentage || 0),
        );
      }
    },
    [loanTypes, setValue],
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
    if (endDate) setValue('endDate', endDate);
  }, [endDate, setValue]);

  const amortData = useMemo(() => {
    if (watchAmount <= 0 || watchTermUnits <= 0) return null;
    return calculateFrenchAmortization(
      watchAmount,
      watchRate,
      watchTermUnits,
      (watchTermType as 'installments' | 'quotas') || 'installments',
      watchStartDate || new Date(),
      watchExpensesPct,
    );
  }, [watchAmount, watchRate, watchTermUnits, watchTermType, watchStartDate, watchExpensesPct]);

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
    if (watchAmount > associateData.available80) {
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
    const monthlyPmt = amortData?.monthlyPayment ?? 0;
    if (
      watchAmount > 0 &&
      monthlyPmt > 0 &&
      monthlyPmt > associateData.paymentCapacity
    ) {
      r.canSave = false;
      r.messages.push(
        `La cuota (${formatCurrency(monthlyPmt)}) supera capacidad de pago del 30% (${formatCurrency(associateData.paymentCapacity)})`,
      );
    } else if (associateData.paymentCapacity > 0) {
      r.messages.push(
        `Capacidad de pago (30%): ${formatCurrency(associateData.paymentCapacity)} Bs/mes`,
      );
    }
    if (!selectedType) {
      r.canSave = false;
      r.messages.push('Seleccione un tipo de préstamo');
    }
    if (
      Number(selectedType?.minLoanAmount) > 0 &&
      watchAmount < Number(selectedType?.minLoanAmount)
    ) {
      r.canSave = false;
      r.messages.push(
        `El monto mínimo es ${formatCurrency(Number(selectedType?.minLoanAmount))} Bs`,
      );
    }
    if (
      Number(selectedType?.maxLoanAmount) > 0 &&
      watchAmount > Number(selectedType?.maxLoanAmount)
    ) {
      r.canSave = false;
      r.messages.push(
        `El monto máximo es ${formatCurrency(Number(selectedType?.maxLoanAmount))} Bs`,
      );
    }
    return r;
  }, [associateData, watchAmount, selectedType, amortData]);

  const handleFormSubmit = useCallback(
    (data: LoanManagement) => {
      const formatted = {
        ...data,
        associateId: data.associateId || associateData?.associate?.id,
        requestedAmount: Number(data.requestedAmount),
        interestRate: Number(data.interestRate),
        termUnits: Number(data.termUnits),
        expensesPercentage: Number(data.expensesPercentage || 0),
        paymentMethod: 'BANK_TRANSFER',
        startDate: data.startDate,
      };

      saveLoan(formatted, {
        onSuccess: () => {
          onClose();
        },
      });
      setConfirmOpen(false);
    },
    [saveLoan, onClose, associateData],
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
            <HandCoins className="h-5 w-5" /> Nueva Solicitud de Préstamo
          </DialogTitle>
          <DialogDescription>
            Complete el formulario para crear una solicitud de préstamo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pr-1 mt-4">
          {/* SEARCH SECTION */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ingrese Cédula del Asociado..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value.replace(/\D/g, '').slice(0, 8),
                  )
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={searching}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>

          {searching && !associateData && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-2">
                Validando asociado...
              </p>
            </div>
          )}

          {/* ASSOCIATE DATA */}
          {!searching && associateData?.associate && (
            <div
              className={`rounded-lg border p-4 space-y-2 relative ${hasBlocks
                ? 'border-destructive/30 bg-destructive/5'
                : 'bg-muted/30'
                }`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
                Datos del Asociado
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Nombre y Apellido:
                  </span>
                  <span className="text-sm font-bold">
                    {associateData.associate.fullname}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cédula:
                  </span>
                  <span className="text-sm font-mono">
                    {associateData.associate.cedula}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Nro. Cuenta:
                  </span>
                  <span className="text-sm font-mono font-semibold">
                    {associateData.account?.accountNumber || '—'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="text-sm text-muted-foreground">
                    Saldo Total:
                  </span>
                  <span className="text-lg font-black text-primary">
                    {formatCurrency(associateData.balance)} Bs
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-muted-foreground">
                    80% Disponible:
                  </span>
                  <span className="text-lg font-black text-[#305AD9]">
                    {formatCurrency(associateData.available80)} Bs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cap. Pago (30%):
                  </span>
                  <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(associateData.paymentCapacity)} Bs/mes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Salario Base:
                  </span>
                  <span className="text-sm font-mono">
                    {formatCurrency(associateData.baseSalary)} Bs
                  </span>
                </div>
                {/* BLOCK BADGES */}
                {(associateData.hasActiveLoan ||
                  associateData.hasActiveCredit ||
                  associateData.hasPayrollCredit) && (
                    <div className="flex flex-wrap gap-2 pt-2">
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
                    </div>
                  )}
                {!hasBlocks && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Sin bloqueos
                  </span>
                )}
              </div>
            </div>
          )}

          {!searching && !associateData && submittedSearch && (
            <p className="text-sm text-destructive">
              Asociado no encontrado
            </p>
          )}

          {!searching && !associateData && !submittedSearch && (
            <div className="text-center py-6 border border-dashed rounded-lg">
              <User className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2 text-sm">
                Ningún asociado seleccionado
              </p>
            </div>
          )}

          {associateData && (
            <>
              {/* Tipo de Préstamo */}
              <div className="w-full">
                <Label>Tipo de Préstamo *</Label>
                <Select value={watchTypeId} onValueChange={handleTypeChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar tipo de préstamo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(loanTypes) ? loanTypes : []).map(
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
                <div className="rounded-lg border border-[#3098F2]/30 bg-[#3098F2]/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-[#3098F2]" />
                    <span className="text-sm font-semibold uppercase text-muted-foreground">
                      Información del Tipo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Tasa Anual:
                      </span>{' '}
                      <span className="font-medium">
                        {selectedType.interestRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        % Gasto:
                      </span>{' '}
                      <span className="font-medium">
                        {selectedType.administrativeExpensePercentage || '0'}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Plazos:
                      </span>{' '}
                      <span className="font-medium">
                        {selectedType.termUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Modalidad:
                      </span>{' '}
                      <span className="font-medium">
                        {PAYMENT_TYPE_LABELS[selectedType.termType] ||
                          selectedType.termType}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Parámetros del Préstamo */}
              {selectedType && (
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      PARÁMETROS DEL PRÉSTAMO
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Monto del Préstamo *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="mt-1"
                        {...register('requestedAmount', {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.requestedAmount && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.requestedAmount.message as string}
                        </p>
                      )}
                    </div>
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
                        <SelectTrigger className="mt-1 w-full">
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

              {/* Resumen del Préstamo */}
              {selectedType && watchAmount > 0 && amortData && (
                <div className="rounded-lg border border-emerald-500/30 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold uppercase text-muted-foreground">
                      RESUMEN DEL PRÉSTAMO
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Monto Solicitado:
                      </span>{' '}
                      <span className="font-medium">
                        {formatCurrency(amortData.netAmount)} Bs
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Gasto Admin:
                      </span>{' '}
                      <span className="font-medium">
                        {formatCurrency(amortData.expenseAmount)} Bs
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Interés Total:
                      </span>{' '}
                      <span className="font-medium text-red-600">
                        {formatCurrency(amortData.totalInterest)} Bs
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Cuota Mensual:
                      </span>{' '}
                      <span className="font-medium text-[#305AD9]">
                        {formatCurrency(amortData.monthlyPayment)} Bs
                      </span>
                    </div>


                    <div className="col-span-2">
                      <Separator className="my-1" />
                    </div>

                    <div>
                      <span className="text-muted-foreground ">
                        Monto a Desembolsar:
                      </span>{' '}
                      <span className="text-lg font-black text-green-600">
                        {formatCurrency(amortData.capital)} Bs
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Total a Pagar:
                      </span>{' '}
                      <span className="text-lg font-black ">
                        {formatCurrency(
                          amortData.monthlyPayment * watchTermUnits,
                        )}{' '}
                        Bs
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Amortización */}
                  {amortData.schedule.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          TABLA DE AMORTIZACIÓN
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded border">
                        <table className="w-full text-[11px]">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="py-1 px-1 text-left">#</th>
                              <th className="py-1 px-1 text-left">Venc.</th>
                              <th className="py-1 px-1 text-right">
                                Capital
                              </th>
                              <th className="py-1 px-1 text-right">
                                Interés
                              </th>
                              <th className="py-1 px-1 text-right">
                                Cuota
                              </th>
                              <th className="py-1 px-1 text-right">
                                Saldo
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {amortData.schedule
                              .slice(0, 12)
                              .map((inst) => (
                                <tr
                                  key={inst.installmentNumber}
                                  className="border-t"
                                >
                                  <td className="py-1 px-1">
                                    {inst.installmentNumber}
                                  </td>
                                  <td className="py-1 px-1">
                                    {new Date(
                                      inst.dueDate,
                                    ).toLocaleDateString('es')}
                                  </td>
                                  <td className="py-1 px-1 text-right font-mono">
                                    {formatCurrency(
                                      parseFloat(inst.principalAmount),
                                    )}
                                  </td>
                                  <td className="py-1 px-1 text-right font-mono">
                                    {formatCurrency(
                                      parseFloat(inst.interestAmount),
                                    )}
                                  </td>
                                  <td className="py-1 px-1 text-right font-mono font-semibold">
                                    {formatCurrency(
                                      parseFloat(
                                        inst.totalInstallmentAmount,
                                      ),
                                    )}
                                  </td>
                                  <td className="py-1 px-1 text-right font-mono">
                                    {formatCurrency(
                                      parseFloat(
                                        inst.principalBalancePending,
                                      ),
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {amortData.schedule.length > 12 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            + {amortData.schedule.length - 12} cuotas más
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reglas de Negocio */}
              {rules.messages.length > 0 && (
                <div
                  className={`rounded-lg border p-3 space-y-2 ${rules.canSave
                    ? 'border-muted bg-muted/20'
                    : 'border-destructive/30 bg-destructive/5'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {rules.canSave ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      REGLAS DE NEGOCIO
                    </span>
                  </div>
                  <div className="space-y-1">
                    {rules.messages.map((msg, i) => (
                      <p
                        key={i}
                        className={`text-xs ${rules.canSave
                          ? 'text-muted-foreground'
                          : 'text-destructive'
                          }`}
                      >
                        {!rules.canSave && '• '}
                        {msg}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!rules.canSave || isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Solicitar Préstamo
                </Button>
              </div>
            </>
          )}
        </div>

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleSubmit(handleFormSubmit)}
          loading={isSaving}
          title="Confirmar Préstamo"
          description={`¿Está seguro que desea solicitar este préstamo por ${formatCurrency(watchAmount)} Bs para ${associateData?.associate?.fullname}?`}
        />
      </DialogContent>
    </Dialog>
  );
}
