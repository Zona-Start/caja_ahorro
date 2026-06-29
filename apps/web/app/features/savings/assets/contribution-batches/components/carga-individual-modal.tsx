'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Textarea } from '@repo/shadcn/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { AlertModal } from '@/components/shared/alert-modal';
import { AlertCircle, Loader2, Search, User, X, Coins, Check, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { useIndividualLoadStore } from '../../individual-load/store/individual-load-store';
import { useAssociatesByCedula } from '../../individual-load/hooks/use-individual-load-query';
import { useIndividualLoadMutation } from '../../individual-load/hooks/use-individual-load-mutation';
import { ASSOCIATE_MOVEMENT_TYPES } from '../../individual-load/schemas/individual-load-options';
import { formSchema, type LoadAssest } from '../../individual-load/schemas/individual-load-schema';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: Record<string, string> = {
  BANK_TRANSFER: 'Transferencia bancaria',
  MOBILE_PAYMENT: 'Pago Móvil',
  DEPOSIT: 'Depósito',
  CHECK: 'Cheque',
  CASH: 'Efectivo',
  OTHER: 'Otro',
};

export function CargaIndividualModal({ open, onClose }: Props) {
  const toast = useToastSystem();
  const queryClient = useQueryClient();
  const {
    selectedAssociate,
    searchQuery,
    errors,
    setSearchQuery: storeSetSearchQuery,
    setIsSearching,
    setSelectedAssociate,
    setRestrictions,
    clearAll,
  } = useIndividualLoadStore();

  const [shouldFetch, setShouldFetch] = useState(false);
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showBankData, setShowBankData] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: bankAccountsData } = useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];

  const { data, error, isLoading, isError } = useAssociatesByCedula(
    submittedSearchTerm,
    { enabled: shouldFetch && !!submittedSearchTerm.trim(), retry: false },
  );

  const { mutate: saveIndividualLoad, isPending: isSaving } =
    useIndividualLoadMutation();

  const form = useForm<LoadAssest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      associateAccountId: '',
      movementType: 'SAVING_CONTRIBUTION',
      amount: 0,
      employerAmount: 0,
      associateAmount: 0,
      transactionDate: new Date(),
      description: '',
      bankAccountId: undefined,
      paymentMethod: undefined,
      referenceNumber: '',
      includeBankingDetails: true,
    },
  });

  const movementType = form.watch('movementType');
  const watchedAmount = form.watch('amount') || 0;
  const watchedEmployer = form.watch('employerAmount') || 0;
  const watchedAssociate = form.watch('associateAmount') || 0;
  const totalAmount =
    movementType === 'EMPLOYER_CONTRIBUTION'
      ? watchedEmployer + watchedAssociate
      : watchedAmount;

  useEffect(() => {
    setIsSearching(isLoading);
  }, [isLoading, setIsSearching]);

  useEffect(() => {
    if (shouldFetch && !isLoading) {
      setShouldFetch(false);
      if (isError) {
        const errMsg = (error as { message?: string })?.message || '';
        if (errMsg.toLowerCase().includes('not found')) {
          toast.info({ title: 'Asociado no encontrado', description: `Cédula: ${submittedSearchTerm}` });
        } else {
          setRestrictions([errMsg || 'Restricción del asociado']);
        }
        setSelectedAssociate(null);
      } else if (data) {
        const dt = data as { data?: { fullname: string; cedula: string; id: number; accountNumber: string; balance: number; associateAccountsId: number } };
        setSelectedAssociate(dt.data ?? null);
        setRestrictions([]);
        if (dt.data) {
          form.setValue('associateAccountId', String(dt.data.associateAccountsId ?? ''));
        }
      }
    }
  }, [data, isError, error, isLoading, shouldFetch, toast, submittedSearchTerm, form, setSelectedAssociate, setRestrictions]);

  useEffect(() => {
    if (selectedAssociate) {
      form.setValue('associateAccountId', String((selectedAssociate as any).associateAccountsId ?? ''));
    }
  }, [selectedAssociate, form]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast.warning({ title: 'Campo vacío', description: 'Ingrese una cédula.' });
      return;
    }
    queryClient.removeQueries({ queryKey: QUERY_KEYS.individualLoad.all });
    setRestrictions([]);
    setSelectedAssociate(null);
    setSubmittedSearchTerm(trimmed);
    setShouldFetch(true);
  }, [searchQuery, queryClient, setRestrictions, setSelectedAssociate, toast]);

  const handleClear = useCallback(() => {
    clearAll();
    queryClient.removeQueries({ queryKey: QUERY_KEYS.individualLoad.all });
    setSubmittedSearchTerm('');
    setShowBankData(false);
    form.reset();
  }, [clearAll, queryClient, form]);

  const handleSubmit = form.handleSubmit((data) => {
    saveIndividualLoad(data, {
      onSuccess: () => {
        toast.success({ title: 'Carga exitosa', description: `Depósito registrado para ${selectedAssociate?.fullname}` });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contributionBatches.all });
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          handleClear();
          onClose();
        }, 1500);
      },
      onError: (err: unknown) => {
        toast.error({ title: 'Error', description: (err as Error)?.message || 'No se pudo completar' });
      },
    });
    setConfirmOpen(false);
  });

  const hasRestrictions = errors.length > 0;
  const isFormDisabled = !selectedAssociate || isSaving || hasRestrictions;

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Carga Individual de Haberes
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <p className="text-lg font-bold text-green-800">Carga Completada</p>
            <p className="text-sm text-green-700">El depósito fue registrado correctamente.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* SEARCH SECTION */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ingrese Cédula..."
                  value={searchQuery}
                  onChange={(e) => storeSetSearchQuery(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isLoading}
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchQuery.trim() || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>

            {errors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <ul className="list-disc list-inside">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {isLoading && !selectedAssociate && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-2">Validando asociado...</p>
              </div>
            )}

            {/* ASSOCIATE DATA */}
            {!isLoading && selectedAssociate && (
              <div className="rounded-lg border p-4 bg-muted/30 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Datos del Asociado</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nombre y Apellido:</span>
                    <span className="text-sm font-bold">{selectedAssociate.fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cédula:</span>
                    <span className="text-sm font-mono">{selectedAssociate.cedula}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nro. Cuenta:</span>
                    <span className="text-sm font-mono font-semibold">{selectedAssociate.accountNumber}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Saldo:</span>
                    <span className="text-lg font-black text-primary">
                      {formatCurrency(Number(selectedAssociate.balance) || 0, 'VES')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !selectedAssociate && errors.length === 0 && (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <User className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2 text-sm">Ningún asociado seleccionado</p>
              </div>
            )}

            {/* CARGA FORM */}
            {selectedAssociate && (
              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Coins className="h-5 w-5" /> Detalles de la Carga
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="movementType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {Object.entries(ASSOCIATE_MOVEMENT_TYPES).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transactionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha</FormLabel>
                          <FormControl>
                            <CustomCalendar value={field.value} onChange={field.onChange} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {movementType === 'EMPLOYER_CONTRIBUTION' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="employerAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aporte Patrono (VES)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Bs.</span>
                                <Input
                                  className="pl-10 text-lg font-bold h-11"
                                  placeholder="0,00"
                                  value={(field.value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); field.onChange(parseInt(d || '0', 10) / 100); }}
                                  onFocus={(e) => e.target.select()}
                                  disabled={isSaving}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="associateAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aporte Asociado (VES)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Bs.</span>
                                <Input
                                  className="pl-10 text-lg font-bold h-11"
                                  placeholder="0,00"
                                  value={(field.value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); field.onChange(parseInt(d || '0', 10) / 100); }}
                                  onFocus={(e) => e.target.select()}
                                  disabled={isSaving}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto (VES)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Bs.</span>
                              <Input
                                className="pl-10 text-lg font-bold h-11"
                                placeholder="0,00"
                                value={(field.value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); field.onChange(parseInt(d || '0', 10) / 100); }}
                                onFocus={(e) => e.target.select()}
                                disabled={isSaving}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concepto</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descripción del depósito..." className="resize-none" {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* BANK DATA SWITCH */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only peer" checked={showBankData} onChange={(e) => setShowBankData(e.target.checked)} />
                      <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-[#2EA640] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                    </div>
                    <span className="text-sm">Datos bancarios</span>
                  </label>

                  {showBankData && (
                    <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                      <FormField
                        control={form.control}
                        name="bankAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Cuenta Receptora</FormLabel>
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ''} disabled={isSaving}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccione cuenta" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {bankAccounts.map((a: any) => (
                                  <SelectItem key={a.id} value={String(a.id)}>{a.accountName} - {a.accountNumber?.slice(-4)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Método de Pago</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referenceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Nro. Referencia</FormLabel>
                              <FormControl><Input placeholder="Ej. 12345678" {...field} disabled={isSaving} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Total</span>
                      <p className="text-xl font-black text-primary">
                        {formatCurrency(totalAmount, 'VES')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={isFormDisabled}>
                        {isSaving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Procesando...</> : <><Check className="mr-1 h-4 w-4" /> Confirmar Carga</>}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleSubmit}
          loading={isSaving}
          title="Confirmar Depósito"
          description="¿Está seguro que desea registrar este movimiento de haberes?"
        />
      </DialogContent>
    </Dialog>
  );
}
