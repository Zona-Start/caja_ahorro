import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Switch } from '@repo/shadcn/switch';
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
import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import { useSaveLoanTypeMutation } from '../hooks/use-type-loans-mutation';
import {
  type LoanTypeMutation,
  loanTypeMutationSchema,
} from '../schemas/loan-types.schema';

interface LoanTypesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<LoanTypeMutation>;
  disabled?: boolean;
}

export function LoanTypesForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: LoanTypesFormProps) {
  const { mutate: saveLoanType, isPending: isSaving } = useSaveLoanTypeMutation();
  const { data: payrollTypes, isLoading: isLoadingPayroll } = useCategoriesByTypeQuery('payroll_type');

  const toNumeric = (val: unknown): number | undefined => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const isEdit = !!defaultValues?.id;

  const form = useForm<LoanTypeMutation>({
    resolver: zodResolver(loanTypeMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      interestRate: isEdit ? (toNumeric(defaultValues?.interestRate) ?? 0) : 0,
      termType: defaultValues?.termType || 'Plazos',
      termUnits: isEdit ? (toNumeric(defaultValues?.termUnits) ?? 1) : 0,
      cancellationPercentage: isEdit ? toNumeric(defaultValues?.cancellationPercentage) : 0,
      loanAccountChartId: defaultValues?.loanAccountChartId ?? undefined,
      interestEarnedAccountChartId: defaultValues?.interestEarnedAccountChartId ?? undefined,
      specialQuotaAccountChartId: defaultValues?.specialQuotaAccountChartId ?? undefined,
      expenseAccountChartId: defaultValues?.expenseAccountChartId ?? undefined,
      specialQuotaNumber: isEdit ? toNumeric(defaultValues?.specialQuotaNumber) : 0,
      specialQuotaPercentage: isEdit ? toNumeric(defaultValues?.specialQuotaPercentage) : 0,
      maxLoanAmount: isEdit ? toNumeric(defaultValues?.maxLoanAmount) : 0,
      minLoanAmount: isEdit ? toNumeric(defaultValues?.minLoanAmount) : 0,
      payrollTypeId: defaultValues?.payrollTypeId ?? undefined,
      administrativeExpensePercentage: isEdit ? toNumeric(defaultValues?.administrativeExpensePercentage) : 0,
      minimumSeniorityMonths: isEdit ? toNumeric(defaultValues?.minimumSeniorityMonths) : 0,
      acceptsDebitBalance: defaultValues?.acceptsDebitBalance ?? false,
      acceptsGuarantors: defaultValues?.acceptsGuarantors ?? false,
      acceptsAvailability: defaultValues?.acceptsAvailability ?? false,
      acceptsRefinancing: defaultValues?.acceptsRefinancing ?? false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoanTypeMutation) => {
    saveLoanType(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} />
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
                  <Input {...field} disabled={disabled} />
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
                <FormLabel>Tasa de Interés (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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

          <FormField
            control={form.control}
            name="termType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Plazo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Plazos">Plazos</SelectItem>
                    <SelectItem value="Cuotas">Cuotas</SelectItem>
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
                <FormLabel>Número de cuotas o plazos</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    disabled={disabled}
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
                <FormLabel>% Cancelación (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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

          <FormField
            control={form.control}
            name="administrativeExpensePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% Gasto Administrativo (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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

          <FormField
            control={form.control}
            name="minimumSeniorityMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antigüedad Mínima en la Caja (meses)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minLoanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Mínimo (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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

          <FormField
            control={form.control}
            name="maxLoanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Máximo (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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

          <FormField
            control={form.control}
            name="specialQuotaNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número Cuota Especial (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    disabled={disabled}
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
                <FormLabel>% Cuota Especial (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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

          <FormField
            control={form.control}
            name="payrollTypeId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Tipo de Nómina (Opcional)</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  value={field.value || 'none'}
                  disabled={disabled || isLoadingPayroll}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingPayroll ? "Cargando tipos de nómina..." : "Selecciona un tipo de nómina"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ninguno / No aplica</SelectItem>
                    {payrollTypes?.map((payroll) => (
                      <SelectItem key={payroll.id} value={payroll.id}>
                        {payroll.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    disabled={disabled}
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
                    disabled={disabled}
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
                  <FormLabel>Afecta Disponibilidad</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
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
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {disabled ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}