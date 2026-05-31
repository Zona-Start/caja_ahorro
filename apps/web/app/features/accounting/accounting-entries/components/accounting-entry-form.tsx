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
import { cn } from '@repo/shadcn/lib/utils';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useAccountingAccounts } from '../../accounting-accounts/hooks/use-accounting-accounts-query';
import { useAccountingCycles } from '../../accounting-cycles/hooks/use-accounting-cycles-query';
import { useAccountingEntryMutation } from '../hooks/use-accounting-entries-mutation';
import {
  type AccountingEntry,
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
  const { data: cycles } = useAccountingCycles();

  const form = useForm<AccountingEntry>({
    resolver: zodResolver(accountingEntrySchema),
    defaultValues: {
      id: defaultValues?.id,
      tenantId: defaultValues?.tenantId,
      accountingCycleId: defaultValues?.accountingCycleId,
      entryDate: defaultValues?.entryDate
        ? new Date(defaultValues?.entryDate)
        : new Date(),
      description: defaultValues?.description || '',
      currencyCode: 'VES',
      details: defaultValues?.details || [
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
    saveAccountingEntry(data, {
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
    });
  };

  const totalDebit = form
    .watch('details', [])
    .reduce((acc: any, item: any) => acc + (Number(item.debit) || 0), 0);
  const totalCredit = form
    .watch('details', [])
    .reduce((acc: any, item: any) => acc + (Number(item.credit) || 0), 0);
  const difference = totalDebit - totalCredit;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            name="accountingCycleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciclo Contable</FormLabel>
                <SelectSearchable
                  options={
                    cycles?.map((cycle: any) => ({
                      value: cycle.id!.toString(),
                      label: cycle.description,
                    })) || []
                  }
                  onValueChange={field.onChange}
                  placeholder="Seleccione un ciclo"
                  defaultValue={field.value?.toString()}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
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
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
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
                        field.value !== "" ? field.value.toString() : undefined
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
          ))}
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
