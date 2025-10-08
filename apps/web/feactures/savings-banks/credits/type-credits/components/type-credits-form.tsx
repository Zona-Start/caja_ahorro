'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useTypePayroll } from '@/feactures/configurations/type-payroll/hooks/use-query-type-payroll';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ScrollArea } from '@repo/shadcn/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Switch } from '@repo/shadcn/switch';
import { useForm } from 'react-hook-form';
import { useTypeCreditsMutation } from '../hooks/use-mutation-type-credits';
import { TypeCredit, typeCreditSchema } from '../schemas/type-credits.schema';

interface TypeCreditFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<TypeCredit>;
  readOnly?: boolean;
}

export function TypeCreditsForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: TypeCreditFormProps) {
  const { mutate: saveTypeCredits, isPending: isSaving } =
    useTypeCreditsMutation();
  const { data: AccoutingAccountsPlans } = useAccountingAccounts();
  const { data: PayrollType } = useTypePayroll();

  const form = useForm<TypeCredit>({
    resolver: zodResolver(typeCreditSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name || '',
      description: defaultValues?.description || null,
      interestRate: defaultValues?.interestRate
        ? String(defaultValues.interestRate)
        : '0', // Ajuste aquí
      termType: defaultValues?.termType || 'CUOTAS',
      termUnits: defaultValues?.termUnits
        ? String(defaultValues.termUnits)
        : '0', // Ajuste aquí
      cancellationPercentage: defaultValues?.cancellationPercentage || '0',
      creditAccountChartId: defaultValues?.creditAccountChartId,
      interestEarnedAccountChartId: defaultValues?.interestEarnedAccountChartId,
      specialQuotaAccountChartId: defaultValues?.specialQuotaAccountChartId,
      expenseAccountChartId: defaultValues?.expenseAccountChartId,
      specialQuotaNumber: defaultValues?.specialQuotaNumber || '0',
      specialQuotaPercentage: defaultValues?.specialQuotaPercentage || '0',
      maxCreditAmount: defaultValues?.maxCreditAmount || '0',
      minCreditAmount: defaultValues?.minCreditAmount || '0',
      payrollTypeId: defaultValues?.payrollTypeId,
      administrativeExpensePercentage:
        defaultValues?.administrativeExpensePercentage || '0',
      minimumSeniorityMonths: defaultValues?.minimumSeniorityMonths || '0',
      acceptsDebitBalance: defaultValues?.acceptsDebitBalance || false,
      acceptsGuarantors: defaultValues?.acceptsGuarantors || false,
      acceptsAvailability: defaultValues?.acceptsAvailability || false,
      acceptsRefinancing: defaultValues?.acceptsRefinancing || false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: TypeCredit) => {
    saveTypeCredits(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el tipo de crédito',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
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
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa de interés</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plazo o Cuotas</FormLabel>
                  <Select
                    disabled={readOnly}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={readOnly ? 'bg-muted w-full' : 'w-full'}
                      >
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cuotas">Cuotas</SelectItem>
                      <SelectItem value="Plazos">Plazos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Cuotas o Plazo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellationPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje de Cancelación (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creditAccountChartId"
              render={({ field }) => (
                <FormItem className="col-span-2 w-full">
                  <FormLabel>Cuenta Contable Crédito</FormLabel>
                  <SelectSearchable
                    options={
                      AccoutingAccountsPlans?.data?.map((account) => ({
                        value: account.id!.toString(),
                        label: `${account.code} - ${account.name}`,
                      })) || []
                    }
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona cuenta contable"
                    defaultValue={field.value?.toString() || 'null'}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestEarnedAccountChartId"
              render={({ field }) => (
                <FormItem className="col-span-2 w-full">
                  <FormLabel>Cuenta Contable Intereses Ganados</FormLabel>
                  <SelectSearchable
                    options={
                      AccoutingAccountsPlans?.data?.map((account) => ({
                        value: account.id!.toString(),
                        label: `${account.code} - ${account.name}`,
                      })) || []
                    }
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona cuenta contable"
                    defaultValue={field.value?.toString() || 'null'}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialQuotaAccountChartId"
              render={({ field }) => (
                <FormItem className="col-span-2 w-full">
                  <FormLabel>
                    {' '}
                    Cuenta Contable Cuotas Especiales (Opcional)
                  </FormLabel>
                  <SelectSearchable
                    options={
                      AccoutingAccountsPlans?.data?.map((account) => ({
                        value: account.id!.toString(),
                        label: `${account.code} - ${account.name}`,
                      })) || []
                    }
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona cuenta contable"
                    defaultValue={field.value?.toString() || 'null'}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expenseAccountChartId"
              render={({ field }) => (
                <FormItem className="col-span-2 w-full">
                  <FormLabel>Cuenta Contable Gasto (Opcional)</FormLabel>
                  <SelectSearchable
                    options={
                      AccoutingAccountsPlans?.data?.map((account) => ({
                        value: account.id!.toString(),
                        label: `${account.code} - ${account.name}`,
                      })) || []
                    }
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona cuenta contable"
                    defaultValue={field.value?.toString() || 'null'}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialQuotaNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número Cuotas Especiales (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialQuotaPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje Cuotas Especiales (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxCreditAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Límite (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minCreditAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Mínimo (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payrollTypeId"
              render={({ field }) => (
                <FormItem className="col-span-2 w-full">
                  <FormLabel>Tipo de Nomina (Opcional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {PayrollType?.data?.map((item: any) => (
                        <SelectItem
                          key={item.id}
                          value={item.id!.toString()}
                          className={readOnly ? 'bg-muted' : ''}
                        >
                          {item.code} - {item.description}
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
              name="administrativeExpensePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Porcentaje Gastos Administrativos (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minimumSeniorityMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Antigüedad en la Caja Ahorro (Meses) (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptsDebitBalance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Acepta Saldo Deudor</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptsGuarantors"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Acepta Fiadores</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptsAvailability"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Acepta Disponibilidad</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptsRefinancing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Acepta Refinanciamiento</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
