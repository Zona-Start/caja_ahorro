'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Separator } from '@repo/shadcn/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  AlertCircle,
  Loader2,
  Search,
  User,
  X,
  Check,
  BadgeDollarSign,
  DollarSign,
  ListChecks,
  HandCoins,
  Landmark,
} from 'lucide-react';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { useAssociatesByCedula } from '../hooks/use-loans-paid-query';
import { useCreateLoanPaymentMutation } from '../hooks/use-loans-paid-mutation';
import { PAYMENT_METHOD, LOAN_PAYMENT_TYPES } from '../schemas/loans-paid-options';
import { loanPaymentSchema, type LoanPayment } from '../schemas/loans-paid.schema';
import type { AssociatesLoan } from '../schemas/individual-load-api-schema';

const PAYMENT_MODE_LABELS: Record<string, string> = {
  next_installment: 'Pagar cuota correspondiente',
  custom_amount: 'Pagar monto personalizado',
  full_debt: 'Pagar deuda total',
};

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagada',
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
};

function formatCurrency(n: number): string {
  return n?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0,00';
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LoanPaidCreateModal({ open, onClose }: Props) {
  const toast = useToastSystem();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<AssociatesLoan | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>('next_installment');
  const [customAmount, setCustomAmount] = useState<string>('');

  const { data: bankAccountsData } = useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];

  const { data, error, isError, isLoading } = useAssociatesByCedula(
    submittedSearchTerm,
    { enabled: shouldFetch && !!submittedSearchTerm.trim() },
  );

  const { mutate: savePayment, isPending: isSaving } =
    useCreateLoanPaymentMutation();

  const form = useForm<LoanPayment>({
    resolver: zodResolver(loanPaymentSchema),
    defaultValues: {
      loanId: '',
      paymentDate: new Date(),
      paymentType: 'PAYING',
      amount: 0,
      bankId: undefined,
      paymentMethod: 'CASH',
      transactionReference: '',
      comment: '',
    },
  });

  const schedule = selectedAssociate?.loanAmortization || [];
  const pendingSchedule = useMemo(
    () => schedule.filter((s) => s.quotaStatus === 'PENDING' || s.quotaStatus === 'PARTIAL'),
    [schedule],
  );
  const paidSchedule = useMemo(
    () => schedule.filter((s) => s.quotaStatus === 'PAID'),
    [schedule],
  );
  const nextInstallment = pendingSchedule[0];

  const pendingTotal = useMemo(
    () =>
      pendingSchedule.reduce((sum, s) => {
        const total = Number(s.quotaAmount) || 0;
        const paid = Number(s.paidAmount) || 0;
        return sum + Math.max(0, total - paid);
      }, 0),
    [pendingSchedule],
  );

  const calculationResult = useMemo(() => {
    if (!selectedAssociate?.loanId || paymentMode === 'next_installment') {
      if (!nextInstallment) return { amount: 0, count: 0 };
      const due = Number(nextInstallment.quotaAmount) - (Number(nextInstallment.paidAmount) || 0);
      return { amount: Math.max(0, due), count: 1 };
    }
    if (paymentMode === 'full_debt') {
      return { amount: pendingTotal, count: pendingSchedule.length };
    }
    if (paymentMode === 'custom_amount') {
      const val = Number(customAmount) || 0;
      let remaining = val;
      let count = 0;
      for (const inst of pendingSchedule) {
        if (remaining <= 0) break;
        const due = Number(inst.quotaAmount) - (Number(inst.paidAmount) || 0);
        if (remaining >= due) {
          remaining -= due;
          count++;
        } else {
          count++;
          remaining = 0;
        }
      }
      return { amount: val - remaining, count };
    }
    return { amount: 0, count: 0 };
  }, [paymentMode, customAmount, selectedAssociate, pendingSchedule, nextInstallment, pendingTotal]);

  useEffect(() => {
    if (shouldFetch && !isLoading) {
      setShouldFetch(false);
      if (isError) {
        const errMsg = (error as { message?: string })?.message || '';
        if (errMsg.toLowerCase().includes('not found')) {
          toast.info({
            title: 'Asociado no encontrado',
            description: `Cédula: ${submittedSearchTerm}`,
          });
        } else {
          toast.error({
            title: 'Error en búsqueda',
            description: errMsg,
          });
        }
        setSelectedAssociate(null);
      } else if (data) {
        setSelectedAssociate(data);
        if (data.loanId) {
          form.setValue('loanId', data.loanId);
        }
      }
    }
  }, [data, isError, error, isLoading, shouldFetch, submittedSearchTerm, setSelectedAssociate, form, toast]);

  useEffect(() => {
    if (!open) return;
    if (paymentMode === 'next_installment' && nextInstallment) {
      form.setValue('amount', calculationResult.amount);
    } else if (paymentMode === 'full_debt') {
      form.setValue('amount', calculationResult.amount);
    } else if (paymentMode === 'custom_amount') {
      form.setValue('amount', calculationResult.amount);
    }
  }, [paymentMode, calculationResult.amount, nextInstallment, form, open]);

  const handleSearch = useCallback(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      toast.warning({ title: 'Campo vacío', description: 'Ingrese una cédula.' });
      return;
    }
    queryClient.removeQueries({ queryKey: QUERY_KEYS.loansPaid.byCedula(''), exact: false });
    setSelectedAssociate(null);
    form.reset();
    setPaymentMode('next_installment');
    setCustomAmount('');
    setSubmittedSearchTerm(trimmed);
    setShouldFetch(true);
  }, [searchTerm, queryClient, form, toast]);

  const handleClear = useCallback(() => {
    setSelectedAssociate(null);
    setSearchTerm('');
    setSubmittedSearchTerm('');
    setShouldFetch(false);
    setPaymentMode('next_installment');
    setCustomAmount('');
    form.reset();
    queryClient.removeQueries({ queryKey: QUERY_KEYS.loansPaid.byCedula(''), exact: false });
  }, [form, queryClient]);

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const handleSubmit = form.handleSubmit((data) => {
    const payload = {
      ...data,
      amount: calculationResult.amount,
    };
    savePayment(payload, {
      onSuccess: () => {
        toast.success({
          title: 'Pago exitoso',
          description: `Pago registrado para ${selectedAssociate?.fullname}`,
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loansPaid.lists() });
        handleClear();
        onClose();
      },
      onError: (err) => {
        toast.error({
          title: 'Error',
          description: err.message || 'No se pudo registrar el pago',
        });
      },
    });
    setConfirmOpen(false);
  });

  const isFormDisabled = !selectedAssociate?.loanId || isSaving || calculationResult.amount <= 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" /> Nuevo Pago de Préstamo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* ── SECCIÓN 1: BÚSQUEDA ── */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ingrese Cédula del Asociado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchTerm.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>

          {isLoading && !selectedAssociate && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-2">Validando asociado...</p>
            </div>
          )}

          {!isLoading && !selectedAssociate && !error && (
            <div className="text-center py-6 border border-dashed rounded-lg">
              <User className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2 text-sm">Ningún asociado seleccionado</p>
            </div>
          )}

          {/* ── SECCIÓN 2: DATOS DEL ASOCIADO ── */}
          {!isLoading && selectedAssociate && (
            <div className="rounded-lg border border-[#2EA640]/30 bg-[#2EA640]/5 p-4 space-y-3 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-[#2EA640]" />
                <span className="text-sm font-semibold uppercase">DATOS DEL ASOCIADO</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{' '}
                  <span className="font-medium">{selectedAssociate.fullname}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cédula:</span>{' '}
                  <span className="font-medium font-mono">{selectedAssociate.cedula}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nro. Cuenta:</span>{' '}
                  <span className="font-medium font-mono">{selectedAssociate.accountNumber || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── SECCIÓN 3: DATOS DEL PRÉSTAMO ── */}
          {selectedAssociate?.loanId && (
            <div className="rounded-lg border border-[#305AD9]/30 bg-[#305AD9]/5 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <BadgeDollarSign className="h-4 w-4 text-[#305AD9]" />
                <span className="text-sm font-semibold uppercase">PRÉSTAMO ACTIVO</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">N° Préstamo:</span>{' '}
                  <span className="font-mono font-medium">
                    {selectedAssociate.loanCustomReference || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium">{selectedAssociate.loanType || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monto Original:</span>{' '}
                  <span className="font-mono">
                    {selectedAssociate.loanRequestedAmount
                      ? `${formatCurrency(Number(selectedAssociate.loanRequestedAmount))} Bs`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Saldo Pendiente:</span>{' '}
                  <span className="font-mono font-bold text-[#3098F2]">
                    {formatCurrency(pendingTotal)} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cuotas Pagadas:</span>{' '}
                  <span className="font-mono">
                    {paidSchedule.length} / {schedule.length}
                  </span>
                </div>
                {nextInstallment && (
                  <div>
                    <span className="text-muted-foreground">Próxima Cuota:</span>{' '}
                    <span className="font-mono font-semibold text-[#2EA640]">
                      {formatCurrency(Number(nextInstallment.quotaAmount) - (Number(nextInstallment.paidAmount) || 0))} Bs
                    </span>
                    {Number(nextInstallment.paidAmount) > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">(restante)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SECCIÓN 4: TABLA DE AMORTIZACIÓN ── */}
          {selectedAssociate?.loanId && schedule.length > 0 && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase">TABLA DE AMORTIZACIÓN</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1 text-left">#</th>
                      <th className="py-1 text-left">Vencimiento</th>
                      <th className="py-1 text-right">Cuota</th>
                      <th className="py-1 text-right">Pagado</th>
                      <th className="py-1 text-right">Saldo</th>
                      <th className="py-1 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((inst) => {
                      const isNext = inst.quotaNumber === nextInstallment?.quotaNumber;
                      const isPending = inst.quotaStatus === 'PENDING' || inst.quotaStatus === 'PARTIAL';
                      return (
                        <tr
                          key={inst.quotaNumber}
                          className={`border-b last:border-0 ${inst.quotaStatus === 'PAID'
                            ? 'bg-[#2EA640]/10 dark:bg-[#2EA640]/20'
                            : isPending && isNext
                              ? 'bg-yellow-50 dark:bg-yellow-900/30'
                              : ''
                            }`}
                        >
                          <td className="py-1">{inst.quotaNumber}</td>
                          <td className="py-1">
                            {new Date(inst.quotaDate).toLocaleDateString('es-VE')}
                          </td>
                          <td className="py-1 text-right font-mono">
                            {formatCurrency(Number(inst.quotaAmount))}
                          </td>
                          <td className="py-1 text-right font-mono">
                            {formatCurrency(Number(inst.paidAmount || 0))}
                          </td>
                          <td className="py-1 text-right font-mono">
                            {formatCurrency(Number(inst.principalBalancePending || 0))}
                          </td>
                          <td className="py-1">
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] ${inst.quotaStatus === 'PAID'
                                ? 'bg-[#2EA640]/20 text-[#2EA640]'
                                : inst.quotaStatus === 'PARTIAL'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-muted text-muted-foreground'
                                }`}
                            >
                              {STATUS_LABELS[inst.quotaStatus] || inst.quotaStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SECCIÓN 5: DATOS DEL PAGO ── */}
          {selectedAssociate?.loanId && (
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isFormDisabled) return;
                  setConfirmOpen(true);
                }}
                className="space-y-4 border-t pt-4"
              >
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <DollarSign className="h-5 w-5" /> Datos del Pago
                </div>

                {/* Modalidad de pago */}
                <div className="space-y-1">
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                    Modalidad de Pago *
                  </FormLabel>
                  <Select value={paymentMode} onValueChange={(v) => { setPaymentMode(v); setCustomAmount(''); }}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next_installment">
                        Pagar cuota correspondiente ({nextInstallment ? formatCurrency(Number(nextInstallment.quotaAmount) - (Number(nextInstallment.paidAmount) || 0)) : '0,00'} Bs)
                      </SelectItem>
                      <SelectItem value="custom_amount">
                        Pagar monto personalizado
                      </SelectItem>
                      <SelectItem value="full_debt">
                        Pagar deuda total ({formatCurrency(pendingTotal)} Bs)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMode === 'custom_amount' && (
                  <div className="space-y-1">
                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                      Monto a Pagar (Bs) *
                    </FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  </div>
                )}

                {calculationResult.count > 0 && calculationResult.amount > 0 && (
                  <div className="rounded-lg border border-[#2EA640]/30 bg-[#2EA640]/5 p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cuotas a pagar:</span>
                      <span className="font-medium">
                        {calculationResult.count} de {pendingSchedule.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto total del pago:</span>
                      <span className="font-mono font-bold text-[#2EA640]">
                        {formatCurrency(calculationResult.amount)} Bs
                      </span>
                    </div>
                  </div>
                )}

                {paymentMode === 'custom_amount' && calculationResult.amount === 0 && customAmount && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>El monto ingresado no cubre ninguna cuota.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          Fecha de Pago *
                        </FormLabel>
                        <FormControl>
                          <CustomCalendar
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          Método de Pago *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PAYMENT_METHOD).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Landmark className="h-3.5 w-3.5" /> Cuenta Bancaria
                          </span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ''}
                          disabled={isSaving}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder="Seleccionar cuenta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bankAccounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.accountName || 'Cuenta'} - {a.accountNumber?.slice(-4)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transactionReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                          Nro. Referencia
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej. 12345678"
                            {...field}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                        Comentario
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Notas adicionales..."
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Total a Pagar</span>
                    <p className="text-xl font-black text-primary">
                      {formatCurrency(calculationResult.amount)} Bs
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isFormDisabled}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Procesando...
                        </>
                      ) : (
                        <>
                          <Check className="mr-1 h-4 w-4" /> Registrar Pago
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}

          {selectedAssociate && !selectedAssociate.loanId && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>El asociado no tiene préstamos activos.</span>
            </div>
          )}
        </div>

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleSubmit}
          loading={isSaving}
          title="Confirmar Pago"
          description={`¿Está seguro de registrar un pago de ${formatCurrency(calculationResult.amount)} Bs (${calculationResult.count} cuota(s)) al préstamo de ${selectedAssociate?.fullname || 'el asociado'}?`}
        />
      </DialogContent>
    </Dialog>
  );
}
