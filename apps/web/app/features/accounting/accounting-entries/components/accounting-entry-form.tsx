import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@/components/shared/custom-calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { cn } from '@repo/shadcn/lib/utils';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Switch } from '@repo/shadcn/switch';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useAssociatesQuery } from '@/features/savings/partners/associates/hooks/use-associates-query';
import { useAccountingAccounts } from '../../accounting-accounts/hooks/use-accounting-accounts-query';
import { useAccountingEntryMutation } from '../hooks/use-accounting-entries-mutation';
import {
  type AccountingEntry,
  type AccountingEntryDetail,
  accountingEntrySchema,
} from '../schemas/accounting-entry.schema';

interface AccountingEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AccountingEntry>;
}

export function AccountingEntryForm({
  onSuccess,
  onCancel,
  defaultValues,
}: AccountingEntryFormProps) {
  const { mutate: saveAccountingEntry, isPending: isSaving } =
    useAccountingEntryMutation();
  const { data: accounts } = useAccountingAccounts();
  const { data: associatesData } = useAssociatesQuery({ page: 1, limit: 1000 });

  const associateOptions = useMemo(
    () =>
      (associatesData?.data || []).map((a) => ({
        value: a.id,
        label: `${a.cedula} - ${a.fullname}`,
      })),
    [associatesData],
  );

  const form = useForm<AccountingEntry>({
    resolver: zodResolver(accountingEntrySchema),
    defaultValues: {
      id: defaultValues?.id,
      tenantId: defaultValues?.tenantId,
      entryDate: defaultValues?.entryDate
        ? new Date(defaultValues?.entryDate)
        : new Date(),
      description: defaultValues?.description || '',
      currencyCode: 'VES',
      details: defaultValues?.details?.length
        ? defaultValues.details.map((d) => ({
            ...d,
            debit: Number(d.debit) || 0,
            credit: Number(d.credit) || 0,
            useAssociate: !!d.associateId,
          }))
        : [
            { accountPlanId: '', debit: 0, credit: 0, description: '' },
            { accountPlanId: '', debit: 0, credit: 0, description: '' },
          ],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'details',
  });

  const onSubmit = (data: AccountingEntry) => {
    // Validar que las filas con auxiliar socio tengan un asociado seleccionado
    const missingAssociate = data.details.some(
      (d) => d.useAssociate && !d.associateId,
    );
    if (missingAssociate) {
      form.setError('root', {
        type: 'manual',
        message:
          'Seleccione un asociado en las filas marcadas con auxiliar socio.',
      });
      return;
    }

    // Se eliminan los campos de UI (`useAssociate`) y de solo lectura (`account`)
    const details = data.details.map((detail) => {
      const { useAssociate, account, ...rest } = detail;
      return {
        ...rest,
        associateId: useAssociate ? (rest.associateId ?? null) : null,
      };
    });

    saveAccountingEntry(
      { ...data, details },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
        onError: (error: any) => {
          form.setError('root', {
            type: 'manual',
            message: error.message || 'Error al guardar el asiento contable',
          });
        },
      },
    );
  };

  const totalDebit = form
    .watch('details', [])
    .reduce((acc: any, item: any) => acc + (Number(item.debit) || 0), 0);
  const totalCredit = form
    .watch('details', [])
    .reduce((acc: any, item: any) => acc + (Number(item.credit) || 0), 0);
  const difference = totalDebit - totalCredit;

  // Log de depuración: muestra en consola qué campos está marcando la validación Zod
  useEffect(() => {
    const errors = form.formState.errors;
    if (errors && Object.keys(errors).length > 0) {
      console.warn(
        '[AccountingEntryForm] ❌ Errores de validación Zod:',
        errors,
      );
      console.warn(
        '[AccountingEntryForm] Valores actuales:',
        JSON.parse(JSON.stringify(form.getValues())),
      );
    }
  }, [form.formState.errors, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error(
            '[AccountingEntryForm] ❌ Validación Zod fallida (submit):',
            errors,
          );
          console.error(
            '[AccountingEntryForm] Valores enviados:',
            JSON.parse(JSON.stringify(form.getValues())),
          );
        })}
        className="space-y-4"
      >
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha del Asiento</FormLabel>
                <FormControl>
                  <CustomCalendar
                    value={field.value || null}
                    onChange={field.onChange}
                    placeholder="Seleccione una fecha"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Descripción del asiento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Detalles del Asiento</h3>
          <div className="grid grid-cols-12 gap-2 p-2 rounded-md bg-muted/50">
            <div className="col-span-4 font-semibold">Cuenta</div>
            <div className="col-span-3 font-semibold">Descripción</div>
            <div className="col-span-2 font-semibold text-right">Debe</div>
            <div className="col-span-2 font-semibold text-right">Haber</div>
            <div className="col-span-1"></div>
          </div>
          {fields.map((field, index) => {
            const useAssociate = form.watch(
              `details.${index}.useAssociate`,
            );
            return (
              <div
                key={field.id}
                className="space-y-2 rounded-md border p-2"
              >
                <div className="grid grid-cols-12 gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`details.${index}.accountPlanId`}
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <SelectSearchable
                          options={
                            accounts
                              ?.filter((a: any) => a.allowsMovements)
                              .map((acc: any) => ({
                                value: acc.id!.toString(),
                                label: `${acc.code} - ${acc.name}`,
                              })) || []
                          }
                          onValueChange={field.onChange}
                          placeholder="Seleccione una cuenta"
                          defaultValue={
                            field.value !== ""
                              ? field.value.toString()
                              : undefined
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`details.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormControl>
                          <Input placeholder="Descripción" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`details.${index}.debit`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormControl>
                          <Input
                            className="text-right"
                            value={(field.value || 0).toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const value = parseInt(digits || '0', 10) / 100;
                              field.onChange(value);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`details.${index}.credit`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormControl>
                          <Input
                            className="text-right"
                            value={(field.value || 0).toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const value = parseInt(digits || '0', 10) / 100;
                              field.onChange(value);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Auxiliar socio */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <FormField
                    control={form.control}
                    name={`details.${index}.useAssociate`}
                    render={({ field: f }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={!!f.value}
                            onCheckedChange={(checked) => {
                              f.onChange(checked);
                              if (!checked) {
                                form.setValue(
                                  `details.${index}.associateId`,
                                  null,
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <Label className="text-xs font-normal text-muted-foreground">
                          Auxiliar socio
                        </Label>
                      </FormItem>
                    )}
                  />

                  {useAssociate && (
                    <FormField
                      control={form.control}
                      name={`details.${index}.associateId`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <SelectSearchable
                            options={associateOptions}
                            onValueChange={(value) => f.onChange(value)}
                            placeholder="Buscar asociado por cédula o nombre..."
                            value={f.value ?? undefined}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                accountPlanId: '',
                debit: 0,
                credit: 0,
                description: '',
              })
            }
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Fila
          </Button>
        </div>

        <div className="flex justify-end pt-4 pr-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between font-semibold">
              <span>Total Debe:</span>
              <span>{totalDebit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Haber:</span>
              <span>{totalCredit.toFixed(2)}</span>
            </div>
            <div
              className={cn(
                'flex justify-between font-bold text-lg',
                Math.abs(difference) > 0.01 ? 'text-destructive' : 'text-green-600',
              )}
            >
              <span>Diferencia:</span>
              <span>{difference.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pr-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving || Math.abs(difference) > 0.01}>
            {isSaving ? 'Guardando...' : 'Guardar Asiento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
