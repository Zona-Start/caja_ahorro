import { useAccountingAccounts } from '@/features/accounting/accounting-accounts/hooks/use-accounting-accounts-query';
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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Switch } from '@repo/shadcn/switch';
import { useForm } from 'react-hook-form';
import { useSaveExpenseCategoryMutation } from '../hooks/use-expense-categories-query';
import {
  expenseCategoryMutationSchema,
  type ExpenseCategoryMutation,
} from '../schemas/expense-categories.schema';

interface ExpenseCategoryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<ExpenseCategoryMutation>;
  disabled?: boolean;
}

export function ExpenseCategoryForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: ExpenseCategoryFormProps) {
  const saveMutation = useSaveExpenseCategoryMutation();
  const { data: accounts } = useAccountingAccounts();

  const accountOptions = (accounts ?? [])
    .filter((account) => account.allowsMovements && account.id)
    .map((account) => ({
      value: account.id as string,
      label: `${account.code} - ${account.name}`,
    }));

  const form = useForm<ExpenseCategoryMutation>({
    resolver: zodResolver(expenseCategoryMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name || '',
      accountingAccountId: defaultValues?.accountingAccountId ?? undefined,
      isActive: defaultValues?.isActive ?? true,
    },
    mode: 'onChange',
  });

  const onSubmit = (data: ExpenseCategoryMutation) => {
    saveMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Categoría</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Servicios Básicos"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountingAccountId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Cuenta Contable (opcional)</FormLabel>
              <SelectSearchable
                options={accountOptions}
                onValueChange={(value) =>
                  field.onChange(value === 'null' ? null : value)
                }
                placeholder="Selecciona una cuenta contable"
                defaultValue={field.value || 'null'}
                disabled={disabled}
                enableNoneOption
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Categoría Activa</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {disabled ? (
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4 pt-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
