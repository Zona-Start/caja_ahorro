'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Separator } from '@repo/shadcn/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Switch } from '@repo/shadcn/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Loader2,
  Search,
  User,
  Users,
  X,
  XCircle,
  Wallet,
  Info,
  Send,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBanksQuery } from '@/features/banks/bank-directory/hooks/use-banks-querys';
import {
  useAssociateSettlementQuery,
  useSaveSettlementMutation,
} from '../hooks/use-settlement-query';
import { type AssociatesSettlement } from '../schemas/individual-settlement-api-schema';
import {
  settlementSchema,
  type Settlement,
} from '../schemas/settlement.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SETTLEMENT_DEFAULTS: Settlement = {
  associateId: '',
  date: new Date(),
  notes: '',
  hasBeneficiary: false,
  beneficiary: undefined,
};

export function SettlementModal({ open, onOpenChange }: Props) {
  const toast = useToastSystem();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: associate,
    isFetching: searching,
    isError: searchError,
  } = useAssociateSettlementQuery(submittedSearch, {
    enabled: shouldFetch && !!submittedSearch.trim(),
  });

  const { mutate: saveSettlement, isPending: saving } =
    useSaveSettlementMutation();

  const form = useForm<Settlement>({
    resolver: zodResolver(settlementSchema),
    defaultValues: SETTLEMENT_DEFAULTS,
  });

  const { data: banksData } = useBanksQuery();
  const banks = banksData?.data || [];

  const watchHasBeneficiary = useWatch({
    control: form.control,
    name: 'hasBeneficiary',
  });

  const rules = useMemo(() => {
    const r: { canSave: boolean; messages: { text: string; ok: boolean }[] } = {
      canSave: true,
      messages: [],
    };
    if (!associate) {
      r.canSave = false;
      r.messages.push({
        text: 'Asociado no encontrado o sin datos de liquidación',
        ok: false,
      });
      return r;
    }

    const totalSaving = associate.total_savings_balance;
    const loans = associate.total_outstanding_loans;
    const credits = associate.total_outstanding_credits;
    const net = associate.net_liquidation_amount;

    r.messages.push({
      text: `Total Haberes: ${totalSaving.toLocaleString('es', { minimumFractionDigits: 2 })} Bs`,
      ok: true,
    });

    if (loans > 0) {
      r.messages.push({
        text: `Préstamos Pendientes: ${loans.toLocaleString('es', { minimumFractionDigits: 2 })} Bs (serán cancelados con los haberes)`,
        ok: true,
      });
    }

    if (credits > 0) {
      r.messages.push({
        text: `Créditos Pendientes: ${credits.toLocaleString('es', { minimumFractionDigits: 2 })} Bs (serán cancelados con los haberes)`,
        ok: true,
      });
    }

    if (net < 0) {
      r.canSave = false;
      r.messages.push({
        text: `Las deudas superan los haberes por ${Math.abs(net).toLocaleString('es', { minimumFractionDigits: 2 })} Bs`,
        ok: false,
      });
    }

    if (net >= 0) {
      r.messages.push({
        text: `Monto a liquidar: ${net.toLocaleString('es', { minimumFractionDigits: 2 })} Bs`,
        ok: true,
      });
    }

    return r;
  }, [associate]);

  useEffect(() => {
    if (shouldFetch && !searching) {
      setShouldFetch(false);
      if (searchError) {
        toast.info({
          title: 'Asociado no encontrado',
          description: `No se encontró un asociado con la cédula ${submittedSearch} o no tiene datos de liquidación.`,
        });
        form.setValue('associateId', '');
      } else if (associate?.associate_id) {
        form.setValue('associateId', associate.associate_id);
      }
    }
  }, [searching, shouldFetch, searchError, associate, submittedSearch, form, toast]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast.warning({
        title: 'Campo vacío',
        description: 'Ingrese una cédula.',
      });
      return;
    }
    queryClient.removeQueries({
      queryKey: [...QUERY_KEYS.settlements.all, 'byCedula'],
      exact: false,
    });
    form.reset(SETTLEMENT_DEFAULTS);
    setSubmittedSearch(trimmed);
    setShouldFetch(true);
  }, [searchQuery, queryClient, form, toast]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearch('');
    form.reset(SETTLEMENT_DEFAULTS);
    queryClient.removeQueries({
      queryKey: [...QUERY_KEYS.settlements.all, 'byCedula'],
      exact: false,
    });
  }, [queryClient, form]);

  const [pendingData, setPendingData] = useState<Settlement | null>(null);

  const onFormSubmit = form.handleSubmit((data) => {
    if (!associate?.associate_id) return;
    setPendingData(data);
    setConfirmOpen(true);
  });

  const handleConfirmSave = () => {
    if (!pendingData) return;
    saveSettlement(pendingData, {
      onSuccess: () => {
        toast.success({
          title: 'Solicitud de Liquidación',
          description: 'Creada exitosamente para ' + associate?.fullname,
        });
        setConfirmOpen(false);
        setPendingData(null);
        handleClear();
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        toast.error({
          title: 'Error',
          description:
            (err as any)?.response?.data?.message ??
            (err as Error)?.message ??
            'No se pudo crear la liquidación',
        });
      },
    });
  };

  const hasAssociate = !!associate?.associate_id;
  const isFormDisabled = !hasAssociate || saving || !rules.canSave;

  const handleClose = () => {
    handleClear();
    onOpenChange(false);
  };

  const formatBs = (value: number) =>
    formatCurrency(value, 'VES');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Nueva Liquidación de Haberes
          </DialogTitle>
          <DialogDescription>
            Busque un asociado y revise su estado de cuenta antes de liquidar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* SEARCH SECTION */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ingrese Cédula del Asociado..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value.replace(/\D/g, '').slice(0, 8))
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

          {searching && !associate && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-2">
                Validando asociado...
              </p>
            </div>
          )}

          {/* ASSOCIATE DATA */}
          {!searching && hasAssociate && (
            <div className="rounded-lg border p-4 bg-muted/30 relative">
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
                  <span className="text-sm font-bold">{associate.fullname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cédula:
                  </span>
                  <span className="text-sm font-mono">{associate.cedula}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Nro. Cuenta:
                  </span>
                  <span className="text-sm font-mono font-semibold">
                    {associate.account_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Fecha Ingreso:
                  </span>
                  <span className="text-sm">
                    {new Date(associate.admission_date).toLocaleDateString(
                      'es-VE',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!searching && !associate && !searchError && (
            <div className="text-center py-6 border border-dashed rounded-lg">
              <User className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2 text-sm">
                Ningún asociado seleccionado
              </p>
            </div>
          )}

          {/* LIQUIDATION SUMMARY (Estado de Cuenta) */}
          {hasAssociate && (
            <>
              <div className="rounded-lg border p-4 bg-background">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold uppercase text-muted-foreground">
                    Estado de Cuenta
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Aportes Asociado
                    </span>
                    <span className="text-sm font-medium">
                      {formatBs(associate.haberes_contribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Aportes Empleador
                    </span>
                    <span className="text-sm font-medium">
                      {formatBs(associate.haberes_employer)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Aportes Voluntarios
                    </span>
                    <span className="text-sm font-medium">
                      {formatBs(associate.haberes_voluntary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Excedentes
                    </span>
                    <span className="text-sm font-medium">
                      {formatBs(associate.surpluses)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Retiros
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatBs(associate.total_withdrawals)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Gastos Administrativos
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatBs(associate.total_withdrawal_fees)}
                    </span>
                  </div>

                  <Separator />
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-muted-foreground">
                      Total Haberes
                    </span>
                    <span className="text-lg font-black text-primary">
                      {formatBs(associate.total_savings_balance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-background">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Préstamos Pendientes
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatBs(associate.total_outstanding_loans)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Créditos Pendientes
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatBs(associate.total_outstanding_credits)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-muted-foreground">
                      Monto a liquidar
                    </span>
                    <span
                      className={`text-lg font-black ${
                        associate.net_liquidation_amount >= 0
                          ? 'text-[#2EA640]'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {associate.net_liquidation_amount >= 0 ? '' : '-'}
                      {formatBs(Math.abs(associate.net_liquidation_amount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIQUIDATION FORM */}
              <Form {...form}>
                <form
                  onSubmit={onFormSubmit}
                  className="space-y-4 border-t pt-4"
                >
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Send className="h-5 w-5" /> Confirmar Liquidación
                  </div>

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Liquidación</FormLabel>
                        <FormControl>
                          <CustomCalendar
                            value={field.value}
                            onChange={field.onChange}
                            disabled={saving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Observaciones de la liquidación..."
                            {...field}
                            disabled={saving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* BENEFICIARY SECTION */}
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-4">
                    <FormField
                      control={form.control}
                      name="hasBeneficiary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">
                              Tendrá otro beneficiario
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Active si el monto será transferido a otra persona
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(val) => {
                                field.onChange(val);
                                if (val) {
                                  form.setValue('beneficiary', {
                                    fullname: '',
                                    cedula: '',
                                    phone: '',
                                    accountNumber: '',
                                    bankName: '',
                                    bankId: '',
                                  });
                                } else {
                                  form.setValue('beneficiary', undefined);
                                }
                              }}
                              disabled={saving}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {watchHasBeneficiary && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold uppercase text-muted-foreground">
                            Datos del Beneficiario
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="beneficiary.fullname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre y Apellido</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ej: Juan Pérez"
                                    {...field}
                                    disabled={saving}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="beneficiary.cedula"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cédula</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ej: 12345678"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value.replace(/\D/g, '').slice(0, 8),
                                      )
                                    }
                                    disabled={saving}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="beneficiary.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ej: 0412-1234567"
                                    {...field}
                                    disabled={saving}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="beneficiary.accountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número de Cuenta</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ej: 0152-0123-45-6789012345"
                                    {...field}
                                    disabled={saving}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <FormField
                            control={form.control}
                            name="beneficiary.bankId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Banco</FormLabel>
                                <Select
                                  disabled={saving}
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    const selected = banks.find((b) => b.id === val);
                                    form.setValue(
                                      'beneficiary.bankName',
                                      selected?.name ?? '',
                                    );
                                  }}
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione un banco" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {banks
                                      .filter((b) => b.id != null)
                                      .map((bank) => (
                                        <SelectItem
                                          key={bank.id}
                                          value={bank.id!}
                                        >
                                          {bank.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RULES PANEL */}
                  <div
                    className={`rounded-lg border p-3 ${
                      rules.canSave
                        ? 'border-[#2EA640]/30 bg-[#2EA640]/5'
                        : 'border-destructive/30 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {rules.canSave ? (
                        <CheckCircle2 className="h-4 w-4 text-[#2EA640]" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm font-semibold uppercase text-muted-foreground">
                        {rules.canSave
                          ? 'Condiciones Cumplidas'
                          : 'Condiciones Bloqueantes'}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {rules.messages.map((msg, i) => (
                        <li
                          key={i}
                          className={`text-xs flex items-center gap-1.5 ${
                            msg.ok ? 'text-[#2EA640]' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {msg.ok ? (
                            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 flex-shrink-0" />
                          )}
                          {msg.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* INFO NOTE */}
                  {rules.canSave && (
                    <div className="rounded-lg border border-[#3098F2]/30 bg-[#3098F2]/5 p-3">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-[#3098F2] flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Al aprobar la liquidación, los préstamos y créditos
                          pendientes se cancelarán automáticamente con los
                          haberes del asociado.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Monto Neto
                      </span>
                      <p className="text-xl font-black text-primary">
                        {formatBs(
                          associate.net_liquidation_amount >= 0
                            ? associate.net_liquidation_amount
                            : 0,
                        )}
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
                        {saving ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />{' '}
                            Procesando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4" />{' '}
                            Solicitar Liquidación
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </>
          )}
        </div>

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setPendingData(null);
          }}
          onConfirm={handleConfirmSave}
          loading={saving}
          title="Confirmar Liquidación"
          description={`¿Está seguro de liquidar a ${associate?.fullname}? Los préstamos y créditos pendientes se pagarán con los haberes del asociado.`}
        />
      </DialogContent>
    </Dialog>
  );
}
