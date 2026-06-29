import { zodResolver } from '@hookform/resolvers/zod';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { Button } from '@repo/shadcn/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Switch } from '@repo/shadcn/switch';
import { Separator } from '@repo/shadcn/separator';
import { Textarea } from '@repo/shadcn/textarea';
import { Badge } from '@repo/shadcn/badge';
import { useForm } from 'react-hook-form';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/format-utils';
import { useToastSystem } from '@/hooks/use-toast-system';
import { z } from 'zod';
import {
  useCreateBankMovementMutation,
  useUpdateBankMovementMutation,
} from '../hooks/use-bank-movements-query';
import {
  PAYMENT_METHOD_OPTIONS,
  CATEGORY_OPTIONS,
} from '../schemas/bank-movement-options';
import { bankMovementFormSchema } from '../schemas/bank-movement.schema';
import type { BankMovementForm, BankMovement } from '../schemas/bank-movement.schema';
import { bankMovementsService } from '../services/bank-movements-service';
import type { LinkableRecord } from '../schemas/bank-movement-api.schema';

const formSchema = bankMovementFormSchema.extend({
  movementType: z.enum(['CREDIT', 'DEBIT']).default('CREDIT'),
  amount: z.coerce.number().min(0).optional(),
});

type FormFields = z.infer<typeof formSchema>;

interface BankMovementFormComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<BankMovement>;
  disabled?: boolean;
}

/**
 * Deriva movementType y amount desde creditAmount/debitAmount para edición
 */
function toFormValues(data: Partial<BankMovement> | undefined): Partial<FormFields> {
  const credit = (data as any)?.creditAmount;
  const debit = (data as any)?.debitAmount;

  let movementType: 'CREDIT' | 'DEBIT' = 'CREDIT';
  let amount: number | undefined;
  if (credit && Number(credit) > 0) { movementType = 'CREDIT'; amount = Number(credit); }
  else if (debit && Number(debit) > 0) { movementType = 'DEBIT'; amount = Number(debit); }

  return {
    bankAccountId: (data?.bankAccountId as string) ?? undefined,
    transactionDate: data?.transactionDate
      ? new Date(data.transactionDate as unknown as string)
      : new Date(),
    paymentMethod: data?.paymentMethod ?? undefined,
    description: (data?.description as string) || '',
    category: data?.category ?? undefined,
    creditAmount: 0,
    debitAmount: 0,
    bankReference: (data?.bankReference as string) ?? null,
    valueDate: data?.valueDate
      ? new Date(data.valueDate as unknown as string)
      : undefined,
    note: (data?.note as string) ?? null,
    movementType,
    amount,
  };
}

export function BankMovementForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: BankMovementFormComponentProps) {
  const createMutation = useCreateBankMovementMutation();
  const updateMutation = useUpdateBankMovementMutation();
  const { data: accountsData } = useBankAccountAll();

  const recordId = defaultValues?.id as string | undefined;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const { error: toastError } = useToastSystem();

  const [showLink, setShowLink] = useState(false);
  const [selectedLinkable, setSelectedLinkable] = useState<LinkableRecord | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const debouncedLinkSearch = useDebounce(linkSearch, 400);

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(defaultValues) as any,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });

  const watchCategory = form.watch('category');
  const watchMovementType = form.watch('movementType');
  const watchAmount = form.watch('amount');

  const { data: linkablesData, isLoading: isLoadingLinkables } = useQuery({
    queryKey: ['linkables', watchCategory, debouncedLinkSearch],
    queryFn: () => bankMovementsService.getLinkables(watchCategory || '', {
      page: 1,
      limit: 50,
      q: debouncedLinkSearch || undefined,
    }),
    enabled: showLink && !!watchCategory,
  });

  const linkableRecords = useMemo(() => linkablesData?.data || [], [linkablesData]);

  const buildPayload = (data: FormFields): BankMovementForm => ({
    bankAccountId: data.bankAccountId,
    transactionDate: data.transactionDate,
    paymentMethod: data.paymentMethod,
    description: data.description,
    category: data.category,
    creditAmount: data.movementType === 'CREDIT' ? (data.amount || 0) : 0,
    debitAmount: data.movementType === 'DEBIT' ? (data.amount || 0) : 0,
    bankReference: data.bankReference,
    valueDate: data.valueDate,
    note: data.note,
  });

  const onSubmit = async (formData: FormFields) => {
    const payload = buildPayload(formData);

    if (recordId) {
      updateMutation.mutate(
        { id: recordId, data: payload },
        { onSuccess: () => { form.reset(); onSuccess?.(); } },
      );
    } else if (showLink && selectedLinkable) {
      const links = [{
        internalRecordType: selectedLinkable.type as string,
        internalRecordId: String(selectedLinkable.id),
      }];
      try {
        await bankMovementsService.createAndReconcile({ movement: payload, links });
        form.reset();
        setSelectedLinkable(null);
        setShowLink(false);
        onSuccess?.();
      } catch (err) {
        toastError(
          err instanceof Error ? err.message : 'Error al crear y vincular el movimiento',
        );
      }
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { form.reset(); onSuccess?.(); },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Sección 1: Datos del Movimiento */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Datos del Movimiento</h3>

          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta Bancaria</FormLabel>
                <FormControl>
                  <SelectSearchable
                    options={(accountsData?.data || []).map((account) => ({
                      value: account.id,
                      label: `${account.accountName || ''} - ${account.accountNumber}`,
                    }))}
                    onValueChange={field.onChange}
                    placeholder="Buscar cuenta bancaria..."
                    value={field.value || undefined}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Transacción</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Pago de proveedor" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Sección 2: Monto */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Monto</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CREDIT">Crédito (Entrada)</SelectItem>
                      <SelectItem value="DEBIT">Débito (Salida)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number" step="0.01" min="0" placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(watchMovementType && watchAmount && watchAmount > 0) && (
              <div className="flex items-end pb-2">
                <Badge variant={watchMovementType === 'CREDIT' ? 'success' : 'destructive'}>
                  {watchMovementType === 'CREDIT' ? 'Crédito' : 'Débito'}: {formatCurrency(watchAmount || 0, 'VES')}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Sección 3: Método de Pago */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Método de Pago</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={disabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_OPTIONS).map(([v, l]) => (
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
              name="bankReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia Bancaria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: REF-001" {...field} value={field.value ?? ''} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Sección 4: Vinculación Interna (solo en creación) */}
        {!recordId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Vinculación Interna</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Vincular</span>
                <Switch
                  checked={showLink}
                  onCheckedChange={(checked) => {
                    setShowLink(checked);
                    if (!checked) {
                      setLinkSearch('');
                      setSelectedLinkable(null);
                      form.setValue('category', undefined as any);
                    }
                  }}
                  disabled={disabled}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className={!showLink ? 'hidden' : ''}>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={disabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_OPTIONS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showLink && (
              <div className="rounded-lg border p-4 space-y-3">
                {!watchCategory ? (
                  <p className="text-xs text-muted-foreground">
                    Selecciona una categoría para buscar operaciones vinculables.
                  </p>
                ) : (
                  <>
                    <Input
                      placeholder="Buscar operación..."
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      className="h-8 text-sm"
                    />

                    <div className="max-h-44 overflow-y-auto border rounded-md">
                      {isLoadingLinkables ? (
                        <p className="text-xs text-muted-foreground p-3">Buscando...</p>
                      ) : linkableRecords.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3">
                          No hay operaciones disponibles para vincular.
                        </p>
                      ) : (
                        linkableRecords.map((record) => {
                          const isSelected = selectedLinkable?.id === record.id &&
                            selectedLinkable?.type === record.type;
                          return (
                            <div
                              key={`${record.type}-${record.id}`}
                              onClick={() => setSelectedLinkable(isSelected ? null : record)}
                              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer text-sm hover:bg-accent border-b last:border-b-0 ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{record.concept}</p>
                                <p className="text-xs text-muted-foreground">
                                  {record.date ? new Date(record.date as string).toLocaleDateString() : ''}
                                  {' · '}
                                  {String(record.type).replace(/_/g, ' ')}
                                </p>
                              </div>
                              <span className="font-semibold text-sm ml-2 shrink-0">
                                {record.amount != null ? formatCurrency(Number(record.amount), 'VES') : '-'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {selectedLinkable && (
                      <div className="flex items-center gap-2 bg-primary/5 rounded-md p-2.5">
                        <Badge variant="success" className="text-xs">Vinculado</Badge>
                        <span className="text-xs truncate flex-1">{selectedLinkable.concept}</span>
                        <Button
                          type="button" variant="ghost" size="sm"
                          onClick={() => setSelectedLinkable(null)}
                          className="h-6 text-xs text-destructive"
                        >
                          Quitar
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Nota */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota</FormLabel>
              <FormControl>
                <Textarea placeholder="Nota adicional..." {...field} value={field.value ?? ''} disabled={disabled} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {disabled ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onCancel}>Cerrar</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4 pt-2">
            <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...'
                : recordId ? 'Actualizar'
                  : showLink && selectedLinkable ? 'Crear y Vincular'
                    : 'Crear Movimiento'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
